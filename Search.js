
/* eslint-disable no-restricted-globals */
import React, { Component } from "react";

import { Button, Grid, Hidden, Paper } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";
import classNames from "classnames";
import { cloneDeep } from "lodash";
import FilterVariantIcon from "mdi-react/FilterVariantIcon";
import PropTypes from "prop-types";
import queryString from "query-string";

import SortBy from "../Search/Results/SortBy";

import Filter from "./Results/Filter/Filter";
import ViewSelect from "./Results/Filter/ViewSelect";
import SearchResults from "./Results/SearchResults";
import {
    applyDefaultsToProductFlags,
    backfillAppliedRefinementsResponse,
    InitialDefaultProductFlags,
    generateAppliedRefinements,
    getApplyCatalogFromRefinementGroups,
    getStockStatus,
    getDefaultSelectedFilterSet,
    applyFilterSetRefinementGroups,
    GroupByRefinementMap,
    setUrlSearchParams,
    SortOptionMap,
    clearRefinements,
    formatSearchUrl,
    getAppliedRefinementCount,
    getRefinementGroupByQueryString,
    getRefinementQueryString,
    getSearchOnFromRefinementGroups,
    removeRefinements,
    replaceCategoryRefinements,
    replaceManufacturerRefinement,
    SearchFieldMap,
    SortDirectionMap,
    sortRefinementGroups,
    unsortableColumns,
    augmentAppliedRefinementGroups,
    getAppliedRefinements,
    AlternateSortOptionsMap,
    generateSelectedRefinementGroups,
    urlsAreEqual,
    SearchTabsConsts
} from "./SearchHelper";
import styles from "./search.styles";

import Flyout from "components/ConnectionLib/Flyouts/Flyout";
import TagManager from "components/ConnectionLib/GoogleTagManager/GoogleTagManager";
import DisplayCallStatusMessages from "components/ConnectionLib/Notification/DisplayCallStatusMessages";
import SelectField from "components/ConnectionLib/SelectField/SelectField";
import ThresholdScroller from "components/ConnectionLib/ThresholdScroller/ThresholdScroller";
import {
    getDefaultSearchResultColumnsSetting,
    getDefaultSearchViewSetting,
    getDefaultSearchByCatalogSetting,
    getSavedFilterSetsSetting,
    setSavedFilterSetsSetting
} from "components/Content/AccountSettings/AccountSettingsService";
import ProductAutocomplete from "components/Content/Product/ProductAutocomplete/ProductAutocomplete";
import DefaultProductFlagsDialog from "components/Content/Product/Search/DefaultProductFlagsDialog";
import ResetRefinements from "components/Content/Product/Search/Results/Filter/ResetRefinements";
import SelectedRefinements from "components/Content/Product/Search/Results/Filter/SelectedRefinements";
import SelectProductFlags from "components/Content/Product/Search/SelectProductFlags";
import ContractBar from "components/Content/Quoting/ContractBar/ContractBar";
import MetaSection from "components/Layout/MetaSection/MetaSection";
import { isValidGuid } from "components/Utils/DataUtils";
import { defaultRequestErrorHandler, getData, postData } from "components/Utils/FetchUtils";

class SearchProducts extends Component {
    constructor(props) {
        super(props);
        this.state = this.getSearchInitialState();
        this.state = this.getQueryAdjustedState(this.state);
        this.fetchAbort = new window.AbortController();
        this.fetchPricesAbort = new window.AbortController();
    }

    componentDidMount() {
        const initialState = this.getSearchInitialState();
        this.setState(initialState);

        this.sortUpdate();
        this.filterUpdate();

        window.addEventListener("resize", this.setIsDesktop);
        window.addEventListener("scroll", this.handleShowFixedScroll);

        this.setIsDesktop();
    }

    componentDidUpdate(prevProps) {
        const { resettingPage, historyPopUrl, productRecords } = this.state;
        const { layout, history, currentSelected, setProductContentProps } = this.props;

        console.log("prev selected", prevProps.currentSelected);
        console.log("setProductContentProps", setProductContentProps);
        console.log("curent selected", currentSelected);
        console.log(resettingPage);

        console.log("reseting page", resettingPage);

        let reloadSearch = !resettingPage; //research to reset the resettingPage ahead before hitting it here.
        console.log("reload search", reloadSearch);
        if (prevProps.currentSelected.id !== currentSelected.id) {
            reloadSearch = false;
        }

        if (!layout.state.layoutContextMounted) {
            return;
        }

        const {
            state: { group, org }
        } = layout;

        const currentPopUrl = history.location.pathname + history.location.search;

        if (
            reloadSearch &&
            ((history.action === "POP" && historyPopUrl !== currentPopUrl) ||
                (history.action === "REPLACE" && currentPopUrl === "/product/search") ||
                (history.action === "PUSH" && currentPopUrl === "/product/search") ||
                (history.action === "PUSH" && historyPopUrl === "") ||
                prevProps.layout.state.org.organizationId !== org.organizationId ||
                prevProps.layout.state.group.id !== group.id ||
                prevProps.currentSelected.id !== currentSelected.id)
        ) {
            if (
                prevProps.layout.state.org.organizationId !== org.organizationId ||
                prevProps.layout.state.group.id !== group.id
            ) {
                history.push("/product/search");
                return;
            }

            const isHistoryPop = history.action === "POP";
            this.setState(
                {
                    resettingPage: true,
                    historyPopUrl:
                        history.action === "PUSH" && historyPopUrl === ""
                            ? currentPopUrl
                            : historyPopUrl
                },
                () => {
                    const initialState = this.getSearchInitialState();
                    const adjustedState = this.getQueryAdjustedState(initialState);
                    adjustedState.historyPopUrl = currentPopUrl;
                    this.setState(adjustedState, async () => {
                        await this.performMount(isHistoryPop);
                    });
                }
            );
            return;
        }

        const unpricedProducts = productRecords.filter(
            prod =>
                prod.isPriced &&
                prod.adjustedCost === 0 &&
                prod.basePriceMargin === 0 &&
                prod.listPriceMargin === 0 &&
                prod.customerPriceMargin === 0 &&
                prod.availabilityStatus === null &&
                prod.availabilityStatusMessage === null
        );
        if (unpricedProducts.length > 0) {
            this.getPrices(unpricedProducts);
        }
    }

    componentWillUnmount() {
        const initialState = this.getSearchInitialState();
        this.setState(initialState);

        window.removeEventListener("resize", this.setIsDesktop);
        window.removeEventListener("scroll", this.handleShowFixedScroll);

        // Need to abort the fetch on unmount because the success sets the url which causes redirect issues if the user
        // leaves the page before a search request finishes.
        this.fetchAbort.abort();
        this.fetchPricesAbort.abort();
    }

    sortUpdate = () => {
        const values = sessionStorage.getItem("values");
        const refinement = JSON.parse(sessionStorage.getItem("refinement"));
        const productFlags = JSON.parse(sessionStorage.getItem("productFlags"));

        setTimeout(() => {
            if (values) {
                this.handleSortByChange(values);
            }
            if (refinement) {
                this.setState({
                    stockStatus: refinement
                });
                this.handleStockStatusChange(refinement);
            }

            if (productFlags) {
                this.handleApplyFlagsClick(productFlags);
            }
        }, 2500);
    };

    filterUpdate = () => {
        const selectedRefinementGroups = JSON.parse(
            sessionStorage.getItem("selectedRefinementGroups")
        );
        //
        const selectedFilterSetName = JSON.parse(sessionStorage.getItem("selectedFilterSetName"));
        //
        const filterSets = JSON.parse(sessionStorage.getItem("filterSets"));
        const filterSetNameValue = JSON.parse(sessionStorage.getItem("filterSetNameValue"));
        const isApplyAndSave = JSON.parse(sessionStorage.getItem("isApplyAndSave"));
        //
        const filterSet = JSON.parse(sessionStorage.getItem("filterSet"));
        //
        const key_array = JSON.parse(sessionStorage.getItem("key_array"));
        const name_array = JSON.parse(sessionStorage.getItem("name_array"));

        setTimeout(() => {
            if (selectedRefinementGroups) {
                this.handleRefinementChange(selectedRefinementGroups);
            }
            if (selectedFilterSetName) {
                this.handleSelectedFilterSetName(selectedFilterSetName);
            }
            if (filterSets && filterSetNameValue && isApplyAndSave) {
                this.handleSaveFilterSets(filterSets, filterSetNameValue, isApplyAndSave);
            }
            if (filterSet) {
                this.handleSelectFilterSet(filterSet);
            }
            if (key_array && name_array) {
                key_array.forEach((key, index) => {
                    this.onRemoveRefinement(key, name_array[index]);
                });
            }
        }, 2500);
    };

    getRowsPerPage = view => {
        return view === "cond" ? 24 : 12;
    };

    getOtherQueryTerms = () => {
        const queryTerms = {
            term: this.getQueryStringTerm(true),
            refineTerm: this.getQueryStringRefineTerm(),
            sortBy: this.getQueryStringSortBy(),
            sortDirection: this.getQueryStringSortDirection(),
            view: this.getQueryStringView()
        };
        return queryTerms;
    };

    performMount = async (isHistoryPop = false) => {
        const { layout } = this.props;
        const { searchQueryStrings } = this.state;

        const {
            state: { user }
        } = layout;

        layout.setCustomerSelect({ disabled: false, notAllowed: false });

        if (layout.state.layoutContextMounted && searchQueryStrings) {
            this.setState(
                state => ({
                    isLoading: !!state.searchQueryStrings
                }),
                async () => {
                    await this.performSearch.bind(this)(false, true, isHistoryPop, user);

                    const autoComplete = document.getElementsByClassName(
                        "react-autosuggest__input"
                    );

                    if (autoComplete && autoComplete[0]) {
                        autoComplete[0].focus();
                    }
                }
            );
        }
    };

    getApplyCatalog = (groupId, searchOn) => {
        return isValidGuid(groupId) && searchOn === SearchFieldMap.CUSTOMERS_CATALOG;
    };

    getSearchInitialState = () => {
        const view = this.getQueryStringView() || getDefaultSearchViewSetting({});
        console.log("view in initial render:", view, location.search);
        const rowsPerPage = this.getRowsPerPage(view);
        const initialState = {
            historyPopUrl: "",
            isLoading: false,
            page: 1,
            originalRequest: {},
            refinementGroups: [],
            productRecords: [],
            mobileFiltersOpen: false,
            searchPerformed: false,
            resetRefinementGroups: [],
            finishedFetchingData: false,
            isDesktop: true,
            productFlagsDialogOpen: false,
            userJsonSettings: {},
            updateRefinementsFromUserJsonSettings: true,
            menuOpen: false,
            filterSets: getSavedFilterSetsSetting({}),
            selectedFilterSetName: "",
            searchResultsColumns: getDefaultSearchResultColumnsSetting({}),
            view,
            rowsPerPage,
            searchOn: this.getQueryStringSearchOn(),
            searchOnChanged: false
        };
        return initialState;
    };

    getQueryAdjustedState = initialState => {
        const selectedRefinementGroups = this.getQueryStringRefinements();
        this.backfillStockStatus(selectedRefinementGroups);
        const otherQueryTerms = this.getOtherQueryTerms();
        const adjustedState = {
            ...initialState,
            selectedRefinementGroups,
            stockStatus: getStockStatus(selectedRefinementGroups),
            ...otherQueryTerms,
            rowsPerPage: this.getQueryStringRowsPerPage(),
            searchQueryStrings: this.getSearchQueryString(),
            searchOn: this.getQueryStringSearchOn()
        };
        adjustedState.searchParams = {
            ...otherQueryTerms
        };

        return adjustedState;
    };

    getProductFlags = () => {
        const { refinementGroups, userJsonSettings } = this.state;

        this.markProductFlagsDefaults(userJsonSettings, refinementGroups);

        const productFlagsGroup = refinementGroups.find(
            item =>
                item.navigationGroupKey.toLowerCase() ===
                GroupByRefinementMap.PRODUCT_FILTERS.toLowerCase()
        );

        const productFlags = productFlagsGroup?.refinements ?? [];
        return productFlags;
    };

    markProductFlagsDefaults = (userJsonSettings, refinementGroups) => {
        const productFlagDefaults = userJsonSettings?.productSearch?.defaultProductFlags ?? [];

        const fullGroup = refinementGroups.find(
            item =>
                item.navigationGroupKey.toLowerCase() ===
                GroupByRefinementMap.PRODUCT_FILTERS.toLowerCase()
        );

        const fullRefinements = fullGroup?.refinements ?? [];
        fullRefinements.forEach(item => {
            if (
                productFlagDefaults.some(
                    defaultItem => item.name === defaultItem.name && defaultItem.isDefault
                )
            ) {
                item.isDefault = true;
            } else {
                item.isDefault = false;
            }
        });
    };

    getSearchOnFromDefaultSearchByCatalogSetting = settingsJson => {
        return getDefaultSearchByCatalogSetting(settingsJson)
            ? SearchFieldMap.CUSTOMERS_CATALOG
            : SearchFieldMap.ALL_PRODUCTS;
    };

    getUserJsonSettings = async (userId, isHistoryPop = false, setStateCallback = null) => {
        const { layout } = this.props;
        const { refinementGroups, productRecords: stateProductRecords } = this.state;
        let { selectedRefinementGroups } = this.state;
        if (userId) {
            try {
                const settingsResponse = await getData(
                    `Customer/GetUserJsonSettings/${encodeURIComponent(userId)}`
                );

                if (!settingsResponse.json) {
                    settingsResponse.json = JSON.stringify(InitialDefaultProductFlags);
                }
                const json = JSON.parse(settingsResponse.json);
                const searchView = getDefaultSearchViewSetting(json);
                const rowsPerPage = this.getRowsPerPage(searchView);
                let selectedFilterSetName = "";
                const filterSets = getSavedFilterSetsSetting(json);
                if (isHistoryPop) {
                    this.setState({
                        resettingPage: true, //this has stopped the reloading issue
                        userJsonSettings: json,
                        searchResultsColumns: getDefaultSearchResultColumnsSetting(json),
                        filterSets,
                        selectedFilterSetName,
                        view: searchView,
                        rowsPerPage
                    });
                    return;
                }

                applyDefaultsToProductFlags(json, refinementGroups, selectedRefinementGroups);
                let appliedRefinements = generateAppliedRefinements(
                    selectedRefinementGroups,
                    refinementGroups
                );
                let searchOn = this.getSearchOnFromDefaultSearchByCatalogSetting(json);
                const searchResultsColumns = getDefaultSearchResultColumnsSetting(json);

                const groupId = layout.state?.group?.id;
                const defaultSelectedFilterSet = getDefaultSelectedFilterSet(filterSets, groupId);
                if (defaultSelectedFilterSet) {
                    selectedFilterSetName = defaultSelectedFilterSet.name;
                    selectedRefinementGroups = defaultSelectedFilterSet.selectedRefinementGroups;
                    applyFilterSetRefinementGroups(selectedRefinementGroups, refinementGroups);
                    selectedRefinementGroups = generateSelectedRefinementGroups(refinementGroups);
                    searchOn = getSearchOnFromRefinementGroups(refinementGroups, groupId);
                    appliedRefinements = generateAppliedRefinements(
                        selectedRefinementGroups,
                        refinementGroups
                    );
                }

                const isLoading = !!setStateCallback;
                const productRecords = setStateCallback ? [] : stateProductRecords;
                const finishedFetchingData = !setStateCallback;
                this.setState(
                    {
                        isLoading,
                        finishedFetchingData,
                        userJsonSettings: json,
                        productRecords,
                        refinementGroups,
                        appliedRefinements,
                        selectedRefinementGroups,
                        selectedFilterSetName,
                        filterSets,
                        searchResultsColumns,
                        stockStatus: getStockStatus(selectedRefinementGroups),
                        searchOn,
                        view: searchView,
                        rowsPerPage
                    },
                    () => {
                        if (setStateCallback) {
                            setStateCallback(true);
                        }
                    }
                );
            } catch (err) {
                defaultRequestErrorHandler(err);

                const view = this.getQueryStringView() || getDefaultSearchViewSetting({});
                console.log("view in initial render:", view, location.search);
                const rowsPerPage = this.getRowsPerPage(view);
                this.setState(
                    {
                        userJsonSettings: {},
                        searchResultsColumns: getDefaultSearchResultColumnsSetting({}),
                        filterSets: getSavedFilterSetsSetting({}),
                        selectedFilterSetName: "",
                        searchOn: this.getSearchOnFromDefaultSearchByCatalogSetting({}),
                        view,
                        rowsPerPage
                    },
                    () => {
                        if (setStateCallback) {
                            setStateCallback();
                        }
                    }
                );
            }
        } else {
            const view = this.getQueryStringView() || getDefaultSearchViewSetting({});
            console.log("view in initial render:", view, location.search);
            const rowsPerPage = this.getRowsPerPage(view);
            this.setState(
                {
                    userJsonSettings: {},
                    searchResultsColumns: getDefaultSearchResultColumnsSetting({}),
                    filterSets: getSavedFilterSetsSetting({}),
                    selectedFilterSetName: "",
                    searchOn: this.getSearchOnFromDefaultSearchByCatalogSetting({}),
                    view,
                    rowsPerPage
                },
                () => {
                    if (setStateCallback) {
                        setStateCallback();
                    }
                }
            );
        }
    };

    setUserJsonSettings = async settings => {
        const { layout } = this.props;
        const { refinementGroups } = this.state;
        let { selectedRefinementGroups } = this.state;
        const {
            state: { user }
        } = layout;

        if (user.id) {
            try {
                const url = `Customer/UpdateUserJsonSettings/${encodeURIComponent(user.id)}`;
                const res = await postData(url, { json: JSON.stringify(settings) });

                DisplayCallStatusMessages.displayMessages(res.callStatus);

                applyDefaultsToProductFlags(settings, refinementGroups, selectedRefinementGroups);
                const appliedRefinements = generateAppliedRefinements(
                    selectedRefinementGroups,
                    refinementGroups
                );

                let searchOn = this.getSearchOnFromDefaultSearchByCatalogSetting(settings);
                let selectedFilterSetName = "";
                const filterSets = getSavedFilterSetsSetting(settings);
                const groupId = layout.state?.group?.id;
                const defaultSelectedFilterSet = getDefaultSelectedFilterSet(filterSets, groupId);
                if (defaultSelectedFilterSet) {
                    selectedFilterSetName = defaultSelectedFilterSet.name;
                    selectedRefinementGroups = defaultSelectedFilterSet.selectedRefinementGroups;
                    applyFilterSetRefinementGroups(selectedRefinementGroups, refinementGroups);
                    searchOn = getSearchOnFromRefinementGroups(refinementGroups, groupId);
                }
                this.setState(
                    {
                        isLoading: true,
                        appliedRefinements,
                        refinementGroups,
                        selectedRefinementGroups,
                        selectedFilterSetName,
                        searchOn,
                        updateRefinementsFromUserJsonSettings: false,
                        userJsonSettings: settings
                    },
                    () => {
                        this.performSearch();
                        this.handleCloseProductFlagsDialog();
                    }
                );
            } catch (err) {
                defaultRequestErrorHandler(err);
            }
        }
    };

    setIsDesktop = _e => {
        const { isDesktop } = this.state;

        if (window.innerWidth > 960 && !isDesktop) {
            this.setState({ isDesktop: true });
        } else if (window.innerWidth <= 960 && isDesktop) {
            this.setState({ isDesktop: false });
        }
    };

    sortQueryRefinements = queryRefinements => {
        if (!queryRefinements) {
            return queryRefinements;
        }
        const refinementGroups = getRefinementGroupByQueryString(queryRefinements);
        if (!refinementGroups || !refinementGroups.length) {
            return queryRefinements;
        }
        sortRefinementGroups(refinementGroups);

        return getRefinementQueryString(refinementGroups);
    };

    getSearchQueryString = url => {
        const { location } = this.props;

        const search = url ? url.search : location.search;

        let searchQueryString = "";
        const queryStrings = queryString.parse(search);
        if (queryStrings) {
            const refinements = this.sortQueryRefinements(queryStrings.refinements || "");
            const rowsPerPage = queryStrings.rowsPerPage || "";
            const refineTerm = queryStrings.refineTerm || "";
            const sortBy = queryStrings.sortBy || "";
            const term = queryStrings.term || "";
            const sortDirection = queryStrings.sortDirection || SortDirectionMap.ASC;

            searchQueryString =
                refinements + term + rowsPerPage + refineTerm + sortBy + sortDirection;
        }

        return searchQueryString;
    };

    onProductAutocompleteChange = newValue => {
        const { searchParams } = this.state;
        if (newValue && newValue.length <= 2) {
            return;
        }
        this.setState({
            term: newValue,
            searchParams: {
                ...searchParams,
                term: newValue
            }
        });
    };

    getResetOtherQueryTerms = view => {
        return {
            page: 1,
            rowsPerPage: this.getRowsPerPage(view),
            refineTerm: null,
            term: "",
            sortBy: SortOptionMap.MOST_POPULAR,
            sortDirection: SortDirectionMap.ASC,
            view
        };
    };

    resetFilters = async () => {
        const { history } = this.props;
        history.push("/product/search");
        return;
    };

    getStateView = () => {
        const { view } = this.state || "cons";
        return view ? view : "cons";
    };

    getQueryStringView = () => {
        const { location } = this.props;

        const queryStrings = queryString.parse(location.search);
        let qsView = queryStrings.view;

        const stateView = this.getStateView();

        // prefer query string view only if it exists and it is different from the current view
        if (qsView && qsView !== stateView) {
            qsView = qsView.replace(new RegExp("-", "g"), " ");
        } else {
            qsView = stateView;
        }
        return qsView;
    };

    getQueryStringSortBy = () => {
        const { location } = this.props;

        let sortBy = SortOptionMap.MOST_POPULAR;
        const queryStrings = queryString.parse(location.search);
        const qsSortBy = queryStrings.sortBy;

        if (qsSortBy) {
            sortBy = qsSortBy; // .replace(new RegExp("-", "g"), " "); // removed this as it doesn't appear necessary and it was breaking the auto select of new sort options that contained hyphens
        }

        return sortBy;
    };

    getQueryStringGroupId = () => {
        const { location } = this.props;

        const queryObj = queryString.parse(location.search);
        const groupId = queryObj.groupId;

        return groupId;
    };

    getQueryStringSortDirection = () => {
        const { location } = this.props;

        const { sortDirection } = queryString.parse(location.search);

        return sortDirection || SortDirectionMap.ASC;
    };

    getQueryStringSearchOn = () => {
        const { location } = this.props;

        const queryStrings = queryString.parse(location.search);
        const refinementQueryString = queryStrings.refinements; //'categories.1:Accessories,categories.2:Camera & Camcorder Accessories,categories.3:Camera Batteries';
        const refinementGroups = getRefinementGroupByQueryString(refinementQueryString);

        const foundGroup = refinementGroups.find(
            item => item.navigationGroupKey === GroupByRefinementMap.CATALOGS
        );

        return foundGroup ? SearchFieldMap.CUSTOMERS_CATALOG : SearchFieldMap.ALL_PRODUCTS;
    };

    getQueryStringPageNumber = () => {
        const { location } = this.props;

        const queryStrings = queryString.parse(location.search);
        const page = parseInt(queryStrings.page, 10);

        return isNaN(page) ? 1 : page;
    };

    getQueryStringRowsPerPage = () => {
        const { location } = this.props;
        const qsView = this.getQueryStringView();

        const queryStrings = queryString.parse(location.search);
        const rowsPerPage = parseInt(queryStrings.rowsPerPage, 10);

        return isNaN(rowsPerPage) ? this.getRowsPerPage(qsView) : rowsPerPage;
    };

    getQueryStringTerm = removeDelimitter => {
        const { location } = this.props;

        let term = "";
        const queryStrings = queryString.parse(location.search);
        const qsTerm = queryStrings.term;

        if (qsTerm !== undefined) {
            if (qsTerm === "") {
                term = null;
            } else {
                term = removeDelimitter
                    ? qsTerm.replace(new RegExp("-", "g"), " ").trim()
                    : qsTerm.trim();
            }
        }

        return term;
    };

    getQueryStringRefinements = () => {
        const { location } = this.props;

        const queryStrings = queryString.parse(location.search);
        const refinementQueryString = queryStrings.refinements; //'categories.1:Accessories,categories.2:Camera & Camcorder Accessories,categories.3:Camera Batteries';
        const refinementGroups = getRefinementGroupByQueryString(refinementQueryString);

        return refinementGroups && refinementGroups.length > 0 ? refinementGroups : [];
    };

    getQueryStringRefineTerm = removeDelimitter => {
        const { location } = this.props;

        let refineTerm = null;
        const queryStrings = queryString.parse(location.search);
        const qsTerm = queryStrings.refineTerm;

        if (qsTerm) {
            refineTerm = removeDelimitter ? qsTerm.replace(new RegExp("-", "g"), " ") : qsTerm;
        }

        return refineTerm;
    };

    handleSearchTermSubmit = event => {
        event.preventDefault();

        const term = event.target[0].value.trim();

        //updae the current tab label with the new search term - @see SearchTabs.js
        this.props.updateTabLabel(term); //validate updateTabLabel is function & exists?

        this.setState(
            prevState => {
                let selectedFilterSetName = prevState.selectedFilterSetName;
                if (prevState.searchOnChanged) {
                    selectedFilterSetName = "";
                }
                return {
                    isLoading: true,
                    page: 1,
                    refineTerm: null,
                    term: term || null,
                    productRecords: [],
                    finishedFetchingData: false,
                    selectedFilterSetName
                };
            },
            () => {
                this.performSearch();
            }
        );
    };

    handleSearchWithinClick = term => {
        this.setState(
            {
                refineTerm: term,
                isLoading: true,
                page: 1,
                productRecords: [],
                finishedFetchingData: false
            },
            () => {
                this.performSearch();
            }
        );
    };

    handleCatalogSearchSubmit = (_selectedCatalogs, searchTerm) => {
        // @@ Handle selectedCatalogs when API is figured out
        this.setState(
            {
                isLoading: true,
                page: 1,
                refineTerm: null,
                term: searchTerm,
                productRecords: [],
                finishedFetchingData: false
            },
            () => {
                this.performSearch();
            }
        );
    };

    handleSortByChange = values => {
        const { searchParams } = this.state;
        let sd = SortDirectionMap.ASC;

        if (values.includes("Z-A") || values.includes("high to low")) {
            sd = SortDirectionMap.DSC;
        }

        this.setState(
            {
                sortBy: values,
                sortDirection: sd,
                isLoading: true,
                page: 1,
                productRecords: [],
                finishedFetchingData: false,
                searchParams: {
                    ...searchParams,
                    sortBy: values,
                    sortDirection: sd
                }
            },
            () => {
                this.performSearch();
            }
        );
    };

    handleApplyFlagsClick = productFlags => {
        this.setState(
            prevState => {
                const {
                    selectedRefinementGroups: prevSelectedRefinementGroups,
                    refinementGroups
                } = prevState;

                const flagsRefinementGroup = refinementGroups.find(
                    item => item.navigationGroupKey === GroupByRefinementMap.PRODUCT_FILTERS
                );

                flagsRefinementGroup.refinements = productFlags.filter(item => item.isApplied);

                const selectedRefinementGroups = cloneDeep(prevSelectedRefinementGroups);
                const findIndex = selectedRefinementGroups.findIndex(
                    item => item.navigationGroupKey === GroupByRefinementMap.PRODUCT_FILTERS
                );

                const clonedFlagsRefinementGroups = cloneDeep(flagsRefinementGroup);
                if (flagsRefinementGroup.refinements.length) {
                    if (findIndex === -1) {
                        selectedRefinementGroups.push(clonedFlagsRefinementGroups);
                    } else {
                        selectedRefinementGroups[findIndex] = clonedFlagsRefinementGroups;
                    }
                } else {
                    if (findIndex > -1) {
                        selectedRefinementGroups.splice(findIndex, 1);
                    }
                }
                return {
                    selectedFilterSetName: "",
                    selectedRefinementGroups,
                    isLoading: true,
                    finishedFetchingData: false,
                    page: 1,
                    productRecords: []
                };
            },
            () => {
                this.performSearch();
            }
        );
    };

    handleStockStatusChange = refinement => {
        this.setState(
            prevState => {
                const { selectedRefinementGroups, refinementGroups } = prevState;
                const stockRefinementGroup = refinementGroups.find(
                    item => item.navigationGroupKey === GroupByRefinementMap.STOCK_STATUS
                );
                let findIndex = stockRefinementGroup.refinements.findIndex(
                    item => item.name === refinement.name
                );
                refinement.isApplied = !refinement.isApplied;
                stockRefinementGroup.refinements[findIndex] = refinement;
                findIndex = selectedRefinementGroups.findIndex(
                    item => item.navigationGroupKey === GroupByRefinementMap.STOCK_STATUS
                );

                if (refinement.isApplied) {
                    stockRefinementGroup.refinements = [];
                    stockRefinementGroup.refinements.push(refinement);
                    if (findIndex === -1) {
                        selectedRefinementGroups.push(stockRefinementGroup);
                    } else {
                        selectedRefinementGroups[findIndex] = stockRefinementGroup;
                    }
                } else {
                    if (findIndex !== -1) {
                        selectedRefinementGroups.splice(findIndex, 1);
                    }
                }
                return {
                    selectedFilterSetName: "",
                    selectedRefinementGroups,
                    isLoading: true,
                    finishedFetchingData: false,
                    page: 1,
                    productRecords: [],
                    stockStatus: refinement.isApplied ? refinement : null
                };
            },
            () => {
                this.performSearch();
            }
        );
    };

    handleSelectFilterSet = filterSet => {
        this.setState({
            selectedFilterSetName: filterSet ? filterSet.name : ""
        });
    };

    handleSaveFilterSets = async (filterSets, filterSetNameValue, isApplyAndSave) => {
        const { layout } = this.props;
        const { userJsonSettings } = this.state;
        const {
            state: { user }
        } = layout;

        const settings = setSavedFilterSetsSetting(userJsonSettings, filterSets);

        if (user.id) {
            try {
                const url = `Customer/UpdateUserJsonSettings/${encodeURIComponent(user.id)}`;
                const res = await postData(url, { json: JSON.stringify(settings) });

                DisplayCallStatusMessages.displayMessages(res.callStatus);

                this.setState(prevState => {
                    let searchOnChanged = prevState.searchOnChanged;
                    if (isApplyAndSave) {
                        searchOnChanged = false;
                    }
                    return {
                        searchOnChanged,
                        updateRefinementsFromUserJsonSettings: false,
                        userJsonSettings: settings,
                        filterSets,
                        selectedFilterSetName: filterSetNameValue
                    };
                });
            } catch (err) {
                defaultRequestErrorHandler(err);
            }
        }
    };

    handleManufacturerClick = (selectedRefinementGroups, manufacturerName) => {
        const updatedRefinementGroups = replaceManufacturerRefinement(
            selectedRefinementGroups,
            manufacturerName
        );

        this.setState(
            {
                selectedRefinementGroups: updatedRefinementGroups,
                isLoading: true,
                page: 1,
                productRecords: [],
                finishedFetchingData: false
            },
            () => {
                this.performSearch();
            }
        );
    };

    handleCategoryClick = (selectedRefinementGroups, categoryRefinementGroups) => {
        const updatedRefinementGroups = replaceCategoryRefinements(
            selectedRefinementGroups,
            categoryRefinementGroups
        );

        this.setState(
            {
                selectedRefinementGroups: updatedRefinementGroups,
                isLoading: true,
                page: 1,
                productRecords: [],
                finishedFetchingData: false
            },
            () => {
                this.performSearch();
            }
        );
    };

    handleRefinementChange = selectedRefinementGroups => {
        const { layout } = this.props;
        const groupId = layout.state?.group?.id;
        const searchOn = getSearchOnFromRefinementGroups(selectedRefinementGroups, groupId);

        this.setState(
            {
                searchOn,
                mobileFiltersOpen: false,
                selectedRefinementGroups,
                stockStatus: getStockStatus(selectedRefinementGroups),
                isLoading: true,
                page: 1,
                productRecords: [],
                finishedFetchingData: false
            },
            () => {
                this.performSearch();
            }
        );
    };

    onViewIconClick = view => {
        const { searchParams } = this.state;
        this.setState(
            {
                view,
                searchParams: {
                    ...searchParams,
                    view
                }
            },
            () => {
                this.updateLocationUrl();
            }
        );
    };

    backfillStockStatus = selectedRefinementGroups => {
        let stockStatusGroup = selectedRefinementGroups.find(
            item =>
                item.navigationGroupKey.toLowerCase() ===
                GroupByRefinementMap.STOCK_STATUS.toLowerCase()
        );

        if (!stockStatusGroup) {
            stockStatusGroup = {
                navigationGroupKey: GroupByRefinementMap.STOCK_STATUS,
                refinements: [
                    {
                        navigationGroupKey: GroupByRefinementMap.STOCK_STATUS,
                        isApplied: true,
                        name: "Sellable Items Only"
                    }
                ]
            };
            selectedRefinementGroups.push(stockStatusGroup);
        }
    };

    getSearchAndNavigateUrl = () => {
        const { layout } = this.props;
        const {
            selectedRefinementGroups,
            term,
            page,
            rowsPerPage,
            refineTerm,
            searchOn,
            sortBy,
            view,
            sortDirection
        } = this.state;

        const productFlagGroup = selectedRefinementGroups.find(
            item =>
                item.navigationGroupKey.toLowerCase() ===
                GroupByRefinementMap.PRODUCT_FILTERS.toLowerCase()
        );

        let refinementGroups = selectedRefinementGroups;
        if (productFlagGroup) {
            const refinements = productFlagGroup?.refinements ?? [];
            productFlagGroup.refinements = refinements.filter(item => item.isApplied);
            refinementGroups = cloneDeep(selectedRefinementGroups);
        }
        const searchParams = {
            refinements: refinementGroups,
            term,
            page,
            rowsPerPage,
            refineTerm,
            sortBy,
            view,
            sortDirection,
            groupId: layout.state.group.id,
            skipRefreshPrice: true,
            applyCatalog: this.getApplyCatalog(layout.state.group.id, searchOn),
            skipRefreshPriceAndAvailability: true
        };

        if (searchParams.sortBy === SortOptionMap.MARGIN && !!layout.state.group?.id) {
            searchParams.sortBy = SortOptionMap.MOST_POPULAR;
        }

        return formatSearchUrl(searchParams);
    };

    updateLocationUrl = () => {
        const { location, history } = this.props;
        const {
            selectedRefinementGroups,
            term,
            refineTerm,
            groupId,
            applyCatalog,
            sortBy,
            view,
            page,
            rowsPerPage,
            sortDirection
        } = this.state;

        const url = new URL("/product/search", window.location.origin);

        setUrlSearchParams(url, {
            refinements: selectedRefinementGroups,
            term,
            refineTerm,
            groupId,
            applyCatalog,
            sortBy,
            view,
            page,
            rowsPerPage,
            sortDirection
        });

        const path = url.pathname + url.search;

        // don't add url to history if it's already applied
        if (!urlsAreEqual(url, location)) {
            history.push(path);
        }

        const queryString = this.getSearchQueryString(url);
        this.setState({
            searchQueryStrings: queryString
        });
    };

    performSearch = async (
        clearResettingPage = false,
        performingMount = false,
        isHistoryPop = false,
        user = null
    ) => {
        const {
            resettingPage,
            searchPerformed,
            finishedFetchingData,
            resetRefinementGroups,
            searchQueryStrings,
            rowsPerPage = 12,
            sortBy
        } = this.state;

        const { layout } = this.props;

        // Reached the end of the productRecords, so stop fetching until there's a new query
        if (finishedFetchingData) {
            this.setState({
                isLoading: false,
                mobileFiltersOpen: false,
                searchPerformed: true
            });
            return;
        }

        let { productRecords } = this.state;

        const newState = {
            isLoading: false,
            mobileFiltersOpen: false,
            searchPerformed: true,
            originalRequest: {},
            refinementGroups: [],
            appliedRefinements: [],
            sortOptions: [],
            productRecords: [],
            totalRecordCount: 0
        };

        let fetchedProducts = [];

        try {
            this.fetchAbort = new window.AbortController();

            const fetchUrl = this.getSearchAndNavigateUrl();
            const data = await getData(fetchUrl, this.fetchAbort);

            console.log("data", data); //what is the api returning?

            const fetchUrlObj = new URL(fetchUrl);
            const currentSearchQueryStrings = this.getSearchQueryString(fetchUrlObj);
            if (searchQueryStrings !== currentSearchQueryStrings) {
                productRecords = [];
            }

            DisplayCallStatusMessages.displayMessages(data.callStatus, {
                showSuccessMessages: false
            });

            // Add isPriced so we can tell which products have been priced or not
            fetchedProducts = data.productRecords.map(product => ({
                ...product,
                isPriced: false
            }));
            const sortOptions = data.sortOptions.filter(opt => !!opt.name);

            backfillAppliedRefinementsResponse(data);

            const selectedRefinementGroups = getAppliedRefinements(data.refinementGroups);
            augmentAppliedRefinementGroups(
                data.originalRequest,
                selectedRefinementGroups,
                data.refinementGroups
            );

            newState.applyCatalog = getApplyCatalogFromRefinementGroups(selectedRefinementGroups);
            newState.searchOn = newState.applyCatalog
                ? SearchFieldMap.CUSTOMERS_CATALOG
                : SearchFieldMap.ALL_PRODUCTS;
            if (newState.applyCatalog) {
                newState.groupId = layout.state.group?.id;
            }
            newState.resettingPage = clearResettingPage ? false : resettingPage;
            newState.searchQueryStrings = currentSearchQueryStrings;
            newState.historyPopUrl = "/product/search" + fetchUrlObj.search;
            newState.originalRequest = data.originalRequest;
            newState.refinementGroups = data.refinementGroups;
            newState.selectedRefinementGroups = selectedRefinementGroups;
            newState.appliedRefinements = generateAppliedRefinements(
                selectedRefinementGroups,
                newState.refinementGroups
            );
            newState.sortOptions = sortOptions;
            newState.productRecords = productRecords.concat(fetchedProducts);
            newState.totalRecordCount = data.totalRecordCount;
            newState.finishedFetchingData =
                newState.productRecords.length >= data.totalRecordCount ||
                data.productRecords.length < rowsPerPage;
            if (sortOptions.findIndex(option => option.name === sortBy) === -1) {
                newState.sortBy = SortOptionMap.MOST_POPULAR;
            }
            if (!searchPerformed || resetRefinementGroups.length <= 0) {
                newState.resetRefinementGroups = newState.refinementGroups;
            }
        } catch (err) {
            defaultRequestErrorHandler(err);
            newState.finishedFetchingData = true;
        } finally {
            this.setState(newState, async () => {
                this.handleShowFixedScroll();
                this.updateLocationUrl();
                this.getPrices(fetchedProducts).then(() => {
                    const { productRecords } = this.state;
                    // If ThresholdScroller is smaller than window height, there will be no scroll bar, and thus no way to scroll for more items.
                    // If that's the case, call onThresholdIntersected to retrieve more results.
                    const threshold = document.getElementById("thresholdScroller");
                    if (threshold && productRecords.length > 0) {
                        const thresholdHeight = threshold.clientHeight;
                        const windowHeight = window.innerHeight;
                        if (!finishedFetchingData && thresholdHeight < (windowHeight * 133) / 100) {
                            this.onThresholdIntersected();
                        }
                    }
                });
                if (performingMount) {
                    await this.getUserJsonSettings(
                        user.id,
                        isHistoryPop,
                        this.performSearch.bind(this)
                    );
                }
            });
        }
    };

    // controlling display of scroll bar since the native scroll bar will appear when
    // the bottom of the results container is completely visible on the screen
    handleShowFixedScroll = () => {
        const { classes } = this.props;
        const fixedScroll = document.querySelector(`.${classes.fixedScrollContainer}`);

        if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
            fixedScroll.style.setProperty("display", "none");
        } else {
            fixedScroll.style.removeProperty("display");
        }
    };

    getPrices = async products => {
        if (!products.length) {
            return;
        }

        const { layout } = this.props;

        try {
            const pricedProductsRequest = {
                GroupId: layout.state.group.id,
                Items: products.map(product => ({ Sku: product.skuNumber, QtyRequested: 1 })),
                IncludeDiscontinued: false
            };

            this.fetchPricesAbort = new window.AbortController();

            const res = await postData(
                "ProductSearch/PriceItems",
                pricedProductsRequest,
                this.fetchPricesAbort
            );

            if (Array.isArray(res.items)) {
                this.setState(({ productRecords }) => ({
                    productRecords: productRecords.map(product => {
                        const pricedProduct = res.items.find(
                            item => product.skuNumber === item.sku
                        );

                        return pricedProduct
                            ? { ...product, ...pricedProduct, isPriced: true }
                            : { ...product, isPriced: true };
                    })
                }));
            }
        } catch (err) {
            defaultRequestErrorHandler(err);
        }
    };

    onRemoveRefinement = (key, name) => {
        const { selectedRefinementGroups, searchOn } = this.state;
        const removeCatalog = key === GroupByRefinementMap.CATALOGS;
        let newSelectedRefinementGroups = selectedRefinementGroups;
        if (selectedRefinementGroups.some(s => s.navigationGroupKey === key)) {
            newSelectedRefinementGroups = removeRefinements(key, name, selectedRefinementGroups);
        }

        this.setState(
            {
                mobileFiltersOpen: false,
                selectedFilterSetName: "",
                selectedRefinementGroups: newSelectedRefinementGroups,
                stockStatus: getStockStatus(newSelectedRefinementGroups),
                isLoading: true,
                page: 1,
                productRecords: [],
                finishedFetchingData: false,
                searchOn: removeCatalog ? SearchFieldMap.ALL_PRODUCTS : searchOn
            },
            () => {
                this.performSearch();
            }
        );
    };

    onThresholdIntersected = () => {
        const { isLoading, finishedFetchingData, resettingPage, productRecords } = this.state;

        if (isLoading || finishedFetchingData || resettingPage || !productRecords.length) {
            return;
        }

        this.setState(
            state => {
                return {
                    page: state.page + 1,
                    isLoading: true
                };
            },
            () => {
                this.performSearch();
            }
        );
    };

    searchOnClick = item => {
        this.setState({
            searchOn: item,
            searchOnChanged: true
        });
    };

    sortByDirectionHandler = (sortBy, currSortBy) => {
        const sObj = {
            same: false,
            optionName: "",
            oppositeName: ""
        };

        if (sortBy === SortOptionMap.AVAILABILITY) {
            sObj.optionName = AlternateSortOptionsMap.AVAILABILITY_LH;
            sObj.oppositeName = AlternateSortOptionsMap.AVAILABILITY_HL;
            sObj.same = currSortBy.includes("Availability");
        } else if (sortBy === SortOptionMap.CATEGORY) {
            sObj.optionName = AlternateSortOptionsMap.CATEGORY_AZ;
            sObj.oppositeName = AlternateSortOptionsMap.CATEGORY_ZA;
            sObj.same = currSortBy.includes("Category");
        } else if (sortBy === SortOptionMap.MANUFACTURER_NAME) {
            sObj.optionName = AlternateSortOptionsMap.MANUFACTURING_AZ;
            sObj.oppositeName = AlternateSortOptionsMap.MANUFACTURING_ZA;
            sObj.same = currSortBy.includes("Manufacturer");
        } else if (sortBy === SortOptionMap.MARGIN) {
            sObj.optionName = AlternateSortOptionsMap.MARGIN_LH;
            sObj.oppositeName = AlternateSortOptionsMap.MARGIN_HL;
            sObj.same = currSortBy.includes("Margin");
        } else if (sortBy === SortOptionMap.PRICE) {
            sObj.optionName = AlternateSortOptionsMap.PRICE_LH;
            sObj.oppositeName = AlternateSortOptionsMap.PRICE_HL;
            sObj.same = currSortBy.includes("Price");
        } else if (sortBy === SortOptionMap.PRODUCT_NAME) {
            sObj.optionName = AlternateSortOptionsMap.PRODUCT_AZ;
            sObj.oppositeName = AlternateSortOptionsMap.PRODUCT_ZA;
            sObj.same = currSortBy.includes("Product");
        } else if (sortBy === SortOptionMap.TECH_TRACK) {
            sObj.optionName = AlternateSortOptionsMap.TECH_TRACK_AZ;
            sObj.oppositeName = AlternateSortOptionsMap.TECH_TRACK_ZA;
            sObj.same = currSortBy.includes("Tech Track");
        } else if (sortBy === SortOptionMap.STATUS) {
            sObj.optionName = AlternateSortOptionsMap.STATUS_AZ;
            sObj.oppositeName = AlternateSortOptionsMap.STATUS_ZA;
            sObj.same = currSortBy.includes("Status");
        } else if (sortBy === SortOptionMap.SKU) {
            sObj.optionName = AlternateSortOptionsMap.SKU_LH;
            sObj.oppositeName = AlternateSortOptionsMap.SKU_HL;
            sObj.same = currSortBy.includes("Sku");
        } else if (sortBy === SortOptionMap.PART_NO) {
            sObj.optionName = AlternateSortOptionsMap.MFR_LH;
            sObj.oppositeName = AlternateSortOptionsMap.MFR_HL;
            sObj.same = currSortBy.includes("MFR");
        } else {
            sObj.optionName = AlternateSortOptionsMap.MOST_POPULAR;
            sObj.oppositeName = AlternateSortOptionsMap.MOST_POPULAR;
            sObj.same = false;
        }

        return sObj;
    };

    handleSortDirectionChange = (sortBy, sortable = true) => _e => {
        if (
            !sortable ||
            unsortableColumns.includes(sortBy) ||
            // Don't sort the column if the user is dragging it to a new location:
            sessionStorage.getItem("searchHeaderDragging") === "true"
        ) {
            sessionStorage.removeItem("searchHeaderDragging");
            return;
        }

        this.setState(
            ({ sortDirection: currSortDirection, sortBy: currSortBy, searchParams }) => {
                // Default sort direction should be ascending
                let sortDirection = SortDirectionMap.ASC;

                const handler = this.sortByDirectionHandler(sortBy, currSortBy);
                let newSortBy = handler.optionName;

                // If the column we're targeting is the same as the one we're already sorting by then toggle the sort direction
                if (handler.same) {
                    sortDirection =
                        currSortDirection === SortDirectionMap.DSC
                            ? SortDirectionMap.ASC
                            : SortDirectionMap.DSC;

                    if (sortDirection === SortDirectionMap.DSC) {
                        newSortBy = handler.oppositeName;
                    }
                }

                return {
                    sortBy: newSortBy,
                    sortDirection,
                    isLoading: true,
                    page: 1,
                    productRecords: [],
                    finishedFetchingData: false,
                    searchParams: {
                        ...searchParams,
                        sortBy: newSortBy,
                        sortDirection
                    }
                };
            },
            () => {
                this.performSearch();
            }
        );
    };

    closeResults = e => {
        const { menuOpen } = this.state;

        if (e) {
            e.preventDefault();
        }

        if (!menuOpen) {
            return;
        }

        this.setState({
            menuOpen: false,
            tooltipOpen: false
        });
    };

    handleCloseProductFlagsDialog = () => {
        this.setState({
            productFlagsDialogOpen: false
        });
    };

    handleEditDefaultProductFlags = () => {
        this.setState({
            productFlagsDialogOpen: true
        });
    };

    handleSaveProductFlagsDialog = async settings => {
        await this.setUserJsonSettings(settings);
        this.handleCloseProductFlagsDialog();
    };

    handleOnThresholdIntersected = () => {
        this.onThresholdIntersected();
    };

    handleSelectedFilterSetName = filterSetName => {
        this.setState({
            selectedFilterSetName: filterSetName
        });
    };

    render() {
        const { classes, layout, className, setProductContentProps } = this.props;

        const {
            isLoading,
            callStatus,
            refineTerm,
            term,
            sortBy,
            stockStatus,
            view,
            searchParams,
            mobileFiltersOpen,
            resetRefinementGroups,
            error,
            originalRequest,
            refinementGroups,
            sortOptions,
            appliedRefinements,
            totalRecordCount,
            productRecords,
            isDesktop,
            rowsPerPage,
            searchOn,
            sortDirection,
            productFlagsDialogOpen,
            userJsonSettings,
            searchResultsColumns,
            filterSets,
            selectedFilterSetName
        } = this.state;

        const appliedRefinementCount = getAppliedRefinementCount(refinementGroups);

        const productFlags = this.getProductFlags();

        const stockStatusGroups = refinementGroups.filter(
            item =>
                item.navigationGroupKey.toLowerCase() ===
                GroupByRefinementMap.STOCK_STATUS.toLowerCase()
        );

        const stockStatusRefinements = stockStatusGroups?.[0]?.refinements ?? [];

        const nSkuCount = productRecords.filter(
            n => n.productStatus !== null && n.productStatus.toUpperCase() === "N"
        ).length;
        console.log("Check test content 2 searchproducts:", setProductContentProps);

        if (callStatus && !callStatus.isSuccessful) {
            return (
                <>
                    <MetaSection title="Search Products" />
                    <Paper className={classes.root} elevation={2}>
                        <Typography variant="body2">
                            Call Status Error: {callStatus.message}
                        </Typography>
                    </Paper>
                </>
            );
        }

        if (error) {
            return (
                <>
                    <MetaSection title="Search Products" />
                    <Paper className={classes.root} elevation={2}>
                        <Typography variant="body2">Error: {error.message}</Typography>
                    </Paper>
                    currentSelected
                </>
            );
        }

        return (
            <div className="app-fade-in">
                <Paper className={classes.root} elevation={2}>
                    <ContractBar context={layout} />
                    <Grid container>
                        <div className={classes.topPanel}>
                            <Grid item md={10} xs={12}>
                                <Grid className={classes.searchCol} container>
                                    <Grid item>
                                        <form
                                            className={className}
                                            onSubmit={this.handleSearchTermSubmit}
                                        >
                                            <ProductAutocomplete
                                                applyCatalog={this.getApplyCatalog(
                                                    layout.state.group.id,
                                                    searchOn
                                                )}
                                                className={classes.autoComplete}
                                                // initialValue={this.props.currentSelected.label}
                                                // initialValue={term}
                                                navigateToPdp
                                                onChange={this.onProductAutocompleteChange}
                                                onFocus={() => {
                                                    TagManager.tagClick("ProductSearch_SearchBar");
                                                }}
                                                placeHolder="Search for a product"
                                                searchField={
                                                    isValidGuid(layout.state.group.id) &&
                                                    searchOn === SearchFieldMap.CUSTOMERS_CATALOG
                                                        ? SearchFieldMap.CUSTOMERS_CATALOG
                                                        : SearchFieldMap.ALL_PRODUCTS
                                                }
                                                searchOnClick={this.searchOnClick}
                                                shouldRenderSuggestions={isDesktop}
                                                showSearchOn={true}
                                                // value={this.props.currentSelected.label}
                                            />
                                        </form>
                                    </Grid>
                                    <Grid item>
                                        <Hidden mdDown>
                                            {appliedRefinementCount > 0 && (
                                                <ResetRefinements
                                                    className={classes.resetRefinement}
                                                    disabled={isLoading}
                                                    onClick={() => {
                                                        this.resetFilters();
                                                        TagManager.tagClick(
                                                            "ProductSearch_ResetFilters"
                                                        );
                                                        ////////////////////////////////////////////
                                                        this.handleRefinementChange(
                                                            getSavedFilterSetsSetting({})
                                                        );
                                                        sessionStorage.setItem(
                                                            "selectedRefinementGroups",
                                                            JSON.stringify(
                                                                getSavedFilterSetsSetting({})
                                                            )
                                                        );
                                                        ////////////////////////////////////////////
                                                        sessionStorage.setItem(
                                                            "key_array",
                                                            JSON.stringify(null)
                                                        );
                                                        sessionStorage.setItem(
                                                            "name_array",
                                                            JSON.stringify(null)
                                                        );
                                                    }}
                                                />
                                            )}
                                        </Hidden>
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Hidden smDown>
                                <Grid item md={2}>
                                    {!isLoading && totalRecordCount !== undefined && (
                                        <div className={classes.recordCount}>
                                            <span style={{ fontSize: 14 }}>
                                                <strong>
                                                    {layout.state.rights.isNonSales
                                                        ? totalRecordCount.toLocaleString()
                                                        : (
                                                              totalRecordCount - nSkuCount
                                                          ).toLocaleString()}
                                                </strong>{" "}
                                                Results
                                            </span>
                                        </div>
                                    )}
                                </Grid>
                            </Hidden>
                        </div>
                    </Grid>
                    <Hidden smDown>
                        <Grid container>
                            <div className={classes.panel}>
                                <Grid item sm={10} xs={8}>
                                    <Button
                                        color="primary"
                                        disabled={isLoading}
                                        lassName={classNames(classes.filterButton, "flyout-toggle")}
                                        onClick={() => {
                                            this.setState({
                                                mobileFiltersOpen: true
                                            });
                                            TagManager.tagClick("ProductSearch_FilterButton");
                                        }}
                                    >
                                        <FilterVariantIcon />
                                        &nbsp;View Filters
                                    </Button>
                                    <SortBy
                                        loading={isLoading}
                                        onSortByChange={values => {
                                            this.handleSortByChange(values);
                                            /////////////////////////////////////
                                            sessionStorage.setItem("values", values);
                                            /////////////////////////////////////
                                        }}
                                        sortBy={{
                                            name: sortBy
                                        }}
                                        sortOptions={sortOptions}
                                    />
                                    <SelectField
                                        className={classNames(classes.stockStatus)}
                                        disabled={isLoading}
                                        displayKey="name"
                                        id="StockStatus_Dropdown"
                                        multiple={false}
                                        onChange={values => {
                                            this.setState({
                                                stockStatus: values
                                            });
                                            this.handleStockStatusChange(values);
                                            /////////////////////////////////////
                                            sessionStorage.setItem(
                                                "refinement",
                                                JSON.stringify(values)
                                            );
                                            /////////////////////////////////////
                                        }}
                                        options={stockStatusRefinements}
                                        placeholder="Stock Status"
                                        value={stockStatus}
                                        valueKey="name"
                                    />
                                    {true && (
                                        <SelectProductFlags
                                            initialProductFlagItems={productFlags}
                                            loading={isLoading}
                                            onApplyFlagsClick={this.handleApplyFlagsClick}
                                            onEditDefaultClick={this.handleEditDefaultProductFlags}
                                        />
                                    )}
                                </Grid>
                                <Grid className={classes.viewSelect} item sm={2} xs={4}>
                                    <ViewSelect
                                        disabled={isLoading}
                                        onCondensedClick={() => this.onViewIconClick("cond")}
                                        onConsildatedClick={() => this.onViewIconClick("cons")}
                                        onGridClick={() => this.onViewIconClick("grid")}
                                        onListClick={() => this.onViewIconClick("list")}
                                        view={view || "grid"}
                                    />
                                </Grid>
                            </div>
                        </Grid>
                    </Hidden>
                    {appliedRefinementCount > 0 && (
                        <Hidden smDown>
                            <Grid
                                alignItems="center"
                                container
                                justify="space-between"
                                wrap="nowrap"
                            >
                                <Grid
                                    component={SelectedRefinements}
                                    item
                                    loading={isLoading}
                                    onRemove={(key, name) => {
                                        this.onRemoveRefinement(key, name);
                                        /////////////////////////////////////
                                        const key_array = JSON.parse(
                                            sessionStorage.getItem("key_array")
                                        );
                                        const name_array = JSON.parse(
                                            sessionStorage.getItem("name_array")
                                        );

                                        if (key_array && name_array) {
                                            sessionStorage.setItem(
                                                "key_array",
                                                JSON.stringify([...key_array, key])
                                            );
                                            sessionStorage.setItem(
                                                "name_array",
                                                JSON.stringify([...name_array, name])
                                            );
                                        } else {
                                            sessionStorage.setItem(
                                                "key_array",
                                                JSON.stringify([key])
                                            );
                                            sessionStorage.setItem(
                                                "name_array",
                                                JSON.stringify([name])
                                            );
                                        }
                                        /////////////////////////////////////
                                    }}
                                    refinements={appliedRefinements}
                                />
                            </Grid>
                        </Hidden>
                    )}
                    <>
                        <Flyout
                            onClose={() => {
                                this.setState({
                                    mobileFiltersOpen: false
                                });
                                TagManager.tagClick("SearchResults_FilterFlyout_Close");
                            }}
                            open={mobileFiltersOpen}
                            title="Filter Search Results"
                        >
                            {mobileFiltersOpen && (
                                <Filter
                                    canApplyCatalog={isValidGuid(layout.state.group.id)}
                                    customCatalog={layout.state.group.customCatalog}
                                    groupId={layout.state.group.id}
                                    handleSelectedFilterSetName={value => {
                                        this.handleSelectedFilterSetName(value);
                                        /////////////////////////////////////
                                        sessionStorage.setItem(
                                            "selectedFilterSetName",
                                            JSON.stringify(value)
                                        );
                                        /////////////////////////////////////
                                    }}
                                    initialFilterSets={filterSets}
                                    onRefinementChange={value => {
                                        this.handleRefinementChange(value);
                                        /////////////////////////////////////
                                        sessionStorage.setItem(
                                            "selectedRefinementGroups",
                                            JSON.stringify(value)
                                        );
                                        /////////////////////////////////////
                                    }}
                                    onSaveFilterSets={(a, b, c) => {
                                        this.handleSaveFilterSets(a, b, c);
                                        /////////////////////////////////////
                                        sessionStorage.setItem("filterSets", JSON.stringify(a));
                                        sessionStorage.setItem(
                                            "filterSetNameValue",
                                            JSON.stringify(b)
                                        );
                                        sessionStorage.setItem("isApplyAndSave", JSON.stringify(c));
                                        /////////////////////////////////////
                                    }}
                                    onSelectFilterSet={value => {
                                        this.handleSelectFilterSet(value);
                                        /////////////////////////////////////
                                        sessionStorage.setItem("filterSet", JSON.stringify(value));
                                        sessionStorage.setItem(
                                            "filterSetNameValue",
                                            JSON.stringify(value)
                                        );
                                        sessionStorage.setItem(
                                            "isApplyAndSave",
                                            JSON.stringify(value)
                                        );

                                        /////////////////////////////////////
                                    }}
                                    originalRequest={originalRequest}
                                    refinementGroups={cloneDeep(refinementGroups)}
                                    resetRefinementGroups={clearRefinements(
                                        cloneDeep(resetRefinementGroups)
                                    )}
                                    searchWithinTerm={refineTerm}
                                    selectedFilterSetName={selectedFilterSetName}
                                    showCatalog={!layout.state.rights.isNonSales}
                                    sortBy={{ name: sortBy }}
                                    term={term}
                                />
                            )}
                        </Flyout>

                        {!isDesktop && (
                            <Grid
                                alignItems="center"
                                container
                                justify="space-between"
                                spacing={2}
                                wrap="nowrap"
                            >
                                <Grid container item xs={4}>
                                    <Button
                                        className={classNames(
                                            classes.filterButtonMobile,
                                            "flyout-toggle"
                                        )}
                                        color="primary"
                                        disabled={isLoading}
                                        onClick={_e => {
                                            this.setState({
                                                mobileFiltersOpen: true
                                            });
                                            TagManager.tagClick("ProductSearch_FilterButton");
                                        }}
                                        variant="text"
                                    >
                                        Filters
                                    </Button>
                                </Grid>
                                <Grid
                                    component={ViewSelect}
                                    disabled={isLoading}
                                    item
                                    onCondensedClick={() => this.onViewIconClick("cond")}
                                    onConsildatedClick={() => this.onViewIconClick("cons")}
                                    onGridClick={() => this.onViewIconClick("grid")}
                                    onListClick={() => this.onViewIconClick("list")}
                                    view={view || "cons"}
                                    xs={4}
                                />
                                <Grid className={classes.recordCountMobile} item xs={4}>
                                    {!isLoading && (
                                        <span>
                                            {layout.state.rights.isNonSales
                                                ? totalRecordCount
                                                : totalRecordCount - nSkuCount}
                                            Results
                                        </span>
                                    )}
                                </Grid>
                            </Grid>
                        )}

                        <DefaultProductFlagsDialog
                            onClose={this.handleCloseProductFlagsDialog}
                            onSave={this.handleSaveProductFlagsDialog}
                            open={productFlagsDialogOpen}
                            userJsonSettings={userJsonSettings}
                        />
                    </>
                    <ThresholdScroller
                        forceRerender={productRecords.length}
                        isLoading={isLoading}
                        onThresholdIntersected={this.handleOnThresholdIntersected}
                        threshold="20vh"
                    >
                        <SearchResults
                            currentlyQuoting={false}
                            currentlySearching
                            groupId={layout.state.group.id}
                            handleCategoryClick={this.handleCategoryClick}
                            handleManufacturerClick={this.handleManufacturerClick}
                            handleSortDirectionChange={this.handleSortDirectionChange}
                            isLoading={isLoading}
                            productRecords={productRecords}
                            refinementGroups={refinementGroups}
                            rowsPerPage={rowsPerPage}
                            searchParams={searchParams}
                            searchResultsColumns={searchResultsColumns}
                            setProductContentProps={setProductContentProps}
                            sortBy={sortBy}
                            sortDirection={sortDirection}
                            view={view || "cons"}
                        />
                    </ThresholdScroller>
                    <div
                        className={classNames(classes.fixedScrollContainer, "fixedScrollContainer")}
                    >
                        <div className={classNames(classes.fixedScroll, "fixedScroll")} />
                    </div>
                </Paper>
            </div>
        );
    }
}

SearchProducts.propTypes = {
    className: PropTypes.string,
    classes: PropTypes.object.isRequired,
    currentSelected: PropTypes.string,
    history: PropTypes.object.isRequired,
    layout: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    setProductContentProps: PropTypes.any
};

export default withStyles(styles)(SearchProducts);


/* eslint-disable react/destructuring-assignment */
import React, { useState, useEffect, useRef } from "react";

import { Tabs, Tab } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "mdi-react/CloseIcon";
import PlusIcon from "mdi-react/PlusIcon";
import PropTypes from "prop-types";
import queryString from "query-string";
import { Link } from "react-router-dom";

import { LayoutContext } from "../../../Contexts/Layout/LayoutContext";
import ProductDetailsFileContent from "../DetailFresh/ProductDetailsFileContent";

import { SearchTabsConsts } from "./SearchHelper.js";
import SearchProductsRoute from "./SearchRoute.js";
//import SearchTabsStyle from "./SearchTabsStyle.js";

const tabHeight = "37px";
const useStyles = makeStyles(theme => ({
    tabsRoot: {
        minHeight: tabHeight,
        height: tabHeight,
        boxShadow: "#fff 0px 10px -20px -20px inset"
    },
    // tabContainer: {
    //     backgroundColor: "#fff"
    // },
    nonActiveTab: {
        minHeight: tabHeight,
        height: tabHeight,
        width: 160.5,
        borderRadius: "4px 4px 0 0",
        // boxShadow: "0 2px 6px 0 rgba(0, 0, 0, 0.5)",
        margin: "0 4px 0 0",
        padding: "9px 11px 12px",
        background: "#fff",
        textTransform: "none",
        fontFamily: "Roboto",
        fontSize: "14px",
        fontWeight: "normal",
        fontStretch: "normal",
        fontStyle: "normal",
        lineHeight: 1.43,
        letterSpacing: "normal",
        textAlign: "right",
        color: "#39474f",
        backgroundImage: "linear-gradient(to bottom, #fff, #fff)"
    },
    activeTab: {
        minHeight: tabHeight,
        height: tabHeight,
        width: 160.5,
        borderRadius: "4px 4px 0 0",
        margin: "0 4px 0 0",
        padding: "9px 11px 12px",
        backgroundImage: "linear-gradient(to bottom, #f5f5f5, #fff)",
        backgroundColor: "#f5f5f5",
        textTransform: "none",
        fontFamily: "Roboto",
        fontSize: "14px",
        fontWeight: 500,
        fontStretch: "normal",
        fontStyle: "normal",
        lineHeight: 1.43,
        letterSpacing: "normal",
        textAlign: "right",
        color: "#000",
        boxShadow: "rgba(50, 50, 93, 3.475) 0px 10px -20px -20px inset"
    },
    labeLContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    },
    tabLabel: {
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        maxWidth: "8rem",
        display: "block"
    },
    closeIcon: {
        float: "right",
        color: "#000000"
    },
    plusIcon: {
        color: "#000000"
    },
    addContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "30px",
        height: "37px",
        padding: "9px 11px 12px",
        backgroundColor: "#fff",
        borderRadius: "4px 4px 0 0"
    }
}));

function SearchTabs(props) {
    const classes = useStyles();
    const [tabList, setTabList] = useState(
        sessionStorage.getItem(SearchTabsConsts.TABS_LIST) !== null
            ? JSON.parse(sessionStorage.getItem(SearchTabsConsts.TABS_LIST)) // here tab list are being retrived 
            : [
                {
                    id: 0,
                    label: "Search Results"
                }
            ]
    );

    const [tabValue, setTabValue] = useState(0);
    const [productContentProps, setProductContentProps] = useState();
    // const [reload, setReload] = useState(false);
    const [searchParams, setSearchParams] = useState(queryString.parse(props.location.search));
    const [currentSelection, setCurrentSelection] = useState(tabList[0]);
    const deleteClicked = useRef(false);
    const [showSearchContent, setShowSearchContent] = useState(true);
    const [itemSelected, setItemSelected] = useState();

    // const handleTabChange = value => {
    //     setTabValue(value);
    // };

    /**
     * Handler when new tab is created.
     */
    const addTab = () => {
        if (tabList.length < 5) {
            const id = tabList[tabList.length - 1].id + 1; //note : here i have new tab id for every new tab created 
            const currentSelection = {  //  here instead of currentSelection , we should use newTab variable
                key: id,
                id,
                label: "New Tab"
            };
            setCurrentSelection(currentSelection);
            setTabList([
                ...tabList,
                //{ key: id, id, label: selections[id], content: "New Content" }
                currentSelection
            ]);
            // setSearchParams(prev => {
            //     return { ...prev, term: "" };
            // });
            props.history.push("/product/search");
        }

        // setLocation(() => {
        //     // eslint-disable-next-line prefer-const
        //     let loc = { ...props.location };
        //     loc.search = loc.search.replace(/term.*?&/g, "term=&");
        //     return loc;
        // });
        // console.log("props", props.location);
    };

    // const closeAll = id => {
    //     setTabList(tabList.filter(tabList => tabList.id !== id));
    // };

    const deleteTabs = tab => {
        // e.stopPropagation();
        deleteClicked.current = true;
        if (tabList.length === 1) {
            return;
        }
        const tabId = parseInt(tab.id);
        console.log(tabId);
        let tabIDIndex = 0;

        let tabs = tabList.filter((value, index) => {
            if (value.id === tabId) {
                tabIDIndex = index;
            }
            return value.id !== tabId;
        });

        tabs = tabs.map(value => {
            let id = value.id;
            if (value.id > tabId) {
                id--;
            }
            return {
                id,
                label: value.label
                //content: "Content"
            };
        });

        let curValue = parseInt(tabValue);
        if (curValue === tabId) {
            if (tabIDIndex === 0) {
                curValue = tabList[tabIDIndex + 1].id;
            } else {
                curValue = tabList[tabIDIndex - 1].id;
            }
        }

        const updatedSlectedIndex =
            currentSelection.id === tabId
                ? 0
                : currentSelection.id > tabId
                    ? currentSelection.id - 1
                    : currentSelection.id;

        setCurrentSelection({ ...tabs[updatedSlectedIndex] });
        setTabValue(curValue);
        setSearchParams(prev => {
            const label = tabs[updatedSlectedIndex].label;
            const newTerm = label !== "New Tab" && label !== "Search Results" ? label : "";
            return { ...prev, term: newTerm };
        });
        setTabList([...tabs]);
        setShowSearchContent(false);
    };

    /**
     * Handler for the delete tab
     * @param {object} tab
     */
    // const deleteTab = tab => {
    //     if (tabList.length === 1) {
    //         return;
    //     }
    //     const deleteIndex = tabList.findIndex(item => item.id === tab.id);
    //     console.log("deleteIndex is");
    //     console.log(deleteIndex);
    //     if (deleteIndex >= 0) {
    //         setCurrentSelection(tabList[0]); //probably you want to show the one on left or right of the deleted one?
    //         setTimeout(() => {
    //             tabList.splice(deleteIndex, 1);
    //             setTabList(tabList);
    //         }, 200);
    //     }
    // };

    /**
     * Handler when the tab itself is clicked
     * @param {*} tab - {key, id, label, content}
     */
    const handleCurrentSelection = tab => {
        setCurrentSelection(tab);
    };

    const handleTabChange = (event: React.SyntheticEvent, tab) => {
        if (!deleteClicked.current) {
            setCurrentSelection(tab);

            setSearchParams(prev => {
                return {
                    ...prev,
                    term: tab.label !== "New Tab" && tab.label !== "Search Results" ? tab.label : ""
                };
            });
        }
        // const loc = { ...props.location };
        // loc.search = loc.search.replace(/term.*?&/g, `term=${tab.label}&`);
        // setLocation(loc);
    };

    /**
     * Update the currenly selected tab's label
     * @param {string} label
     */
    const updateTabLabel = label => {
        tabList[currentSelection.id].label = label;
        setTabList([...tabList]);
        setSearchParams(prev => {
            return { ...prev, term: label };
        });
    };

    const updateSelectedLink = () => {
        const prevSelectedLinks = tabList.map(item => {
            return { term: item.label, link: props.location.search };
        });
    };
    useEffect(() => {
        const prevSelectedLink = sessionStorage.getItem(SearchTabsConsts.SELECTED_LINK);
        if (prevSelectedLink !== null && prevSelectedLink !== "") {
            props.history.push(prevSelectedLink);
            props.location.search = prevSelectedLink;
        }
        sessionStorage.removeItem(SearchTabsConsts.SELECTED_LINK);

        const searchFromLoc = queryString.parse(props.location.search);

        const newLabel = searchParams?.term ?? searchFromLoc?.term;

        const selectedIndex = tabList.findIndex(
            x =>
                (newLabel === "" && (x.label === "Search Results" || x.label === "New Tab")) ||
                x.label === newLabel
        );

        if (selectedIndex !== -1) {
            handleTabChange(undefined, tabList[selectedIndex]);
        } else {
            setTabList(prev => {
                if (searchParams?.term)
                    prev[prev.findIndex(x => x.id === tabValue)].label = searchParams?.term;
                return prev;
            });

           

        }

        return () => { };
    }, []);

    useEffect(() => {
        const prevParams = queryString.parse(props.location.search);

        if (searchParams) {
            if (prevParams?.term !== searchParams?.term && searchParams?.term !== undefined) {
                props.history.push(
                    props.location.search.replace(/term.*?&/g, `term=${searchParams?.term}&`)
                );
                props.location.search = props.location.search.replace(
                    /term.*?&/g,
                    `term=${searchParams?.term}&`
                );
            }
        }
        return () => {
            sessionStorage.setItem(SearchTabsConsts.SELECTED_LINK, props.location.search);
        };
    }, [searchParams]);

    useEffect(() => {
        sessionStorage.setItem(SearchTabsConsts.TABS_LIST, JSON.stringify(tabList));
    }, [tabList]);

    useEffect(() => {
        setShowSearchContent(true);
    }, [showSearchContent]);

    useEffect(() => {
        if (productContentProps) setItemSelected(true);
        else if (itemSelected) {
            setItemSelected(false);
            props.history.push(props.location.search);
        }
    }, [productContentProps]);

    const getTabs = () => {
        return (
            <>
                <Tabs
                    className={classes.tabsRoot}
                    //indicatorColor="primary"
                    onChange={handleTabChange}
                    //scrollButtons="auto"
                    textColor="primary"
                    //variant="scrollable"
                    value={currentSelection}
                >
                    {tabList.map(tab => (
                        <Link
                            className="link"
                            key={tab.id}
                            to={{
                                pathname: props.location.pathname,
                                search: props.location.search.replace(
                                    /term.*?&/g,
                                    `term=${tab.label !== "New Tab" && tab.label !== "Search Results"
                                        ? tab.label
                                        : ""
                                    }&`
                                )
                            }}
                        >
                            <Tab
                                // className={tab.id === currentSelection.id ? "active-tabs" : "tabs"}
                                className={
                                    tab.id === currentSelection.id
                                        ? classes.activeTab
                                        : classes.nonActiveTab
                                }
                                key={tab.id}
                                label={
                                    <div className={classes.labeLContainer}>
                                        <span className={classes.tabLabel}>{tab.label}</span>
                                        <IconButton>
                                            <CloseIcon
                                                className={classes.closeIcon}
                                                id={tab.id}
                                                onClick={() =>
                                                    deleteTabs(tab)
                                                } /* probably onClick={() => deleteTab(tab.id)} would allow access to the right element? */
                                                size={18}
                                            />
                                        </IconButton>
                                    </div>
                                }
                                onClick={() => handleTabChange(undefined, tab)}
                                // style={{ width: "160.5px", height: "20px" }}
                                value={tab}
                            />
                        </Link>
                    ))}
                    {tabList.length < 5 && (
                        // <Grid item lg={1} md={1} sm={1} xl={1} xs={1}>
                        <div className={classes.addContainer}>
                            <IconButton>
                                <PlusIcon className={classes.plusIcon} onClick={addTab} size={18} />
                            </IconButton>
                        </div>
                        // </Grid>
                    )}
                </Tabs>

                {showSearchContent &&
                    (itemSelected ? (
                        <ProductDetailsFileContent
                            {...props}
                            setProductContentProps={setProductContentProps}
                            sku={productContentProps}
                        />
                    ) : (
                        <LayoutContext.Consumer>
                            {layout => (
                                <SearchProductsRoute
                                    currentSelected={currentSelection} //current selected tab to update the search Term => @see Search.js
                                    updateTabLabel={updateTabLabel} //callback function to udpate the label
                                    {...props}
                                    layout={layout}
                                    location={props.location}
                                    setProductContentProps={setProductContentProps}
                                />
                            )}
                        </LayoutContext.Consumer>
                    ))}
            </>
        );
    };

    return (
        <div className="container">
            <div className={classes.tabContainer}>{getTabs()}</div>
            {/* <ProductDetailRoute {...props} /> */}
        </div>
    );
}

SearchTabs.propTypes = {
    location: PropTypes.object
};

export default SearchTabs;
