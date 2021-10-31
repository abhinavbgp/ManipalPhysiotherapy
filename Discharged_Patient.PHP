<html>
<body bgcolor="lightgray">

<?php



$veda=mysql_connect('localhost:3307','root','kuttane');
if(!$veda)
{
 die(" problem again");
}


 $papa=mysql_select_db('manipala');
if($papa<=0)
{
echo("Some Problem in database selection");
}


$month=$_POST['month'];

?>

<center><h3><font color=BLUE face="Lucida Fax"> MONTH</font></h3></center>

<center><h1><font color=red face="Lucida Fax">
<?php
echo($month);
?></font></h1></center>


<font color=green face="Lucida Fax"> Patient who are </font><font color=red face="Lucida Fax"><B>RECOVERED</B> </font>
<?php

$query = "SELECT * FROM discharge WHERE  month='$month'";


$result = mysql_query($query);

?>

<font color=green face="Lucida Fax"><h4>

<?php
$count1=1;
while($P_name_row = mysql_fetch_array($result,MYSQL_ASSOC))
{

$kaka1=$P_name_row[food];

if($kaka1=="Recovered")
{

echo($count1);
echo(".");

echo($P_name_row[P_name]);
echo("   ID=");
echo($P_name_row[P_ID]);

echo("</br>");
echo("</br>");
$count1=$count1+1;

}

}
?></h4></font>

<font color= blue face="Lucida Fax"><h4>
<?php



echo(" NOTE : Total number of Recovered Patient  ");

echo(" in month ");
echo($month);
echo(" = ");
$count1=$count1-1;
echo($count1);

mysql_free_result($result);
 ?></h4></font>






<BR></BR>
<BR></BR>





<font color=green face="Lucida Fax"> Patient who are </font><font color=red face="Lucida Fax"><B>NOT RECOVERED</B> </font>
<?php

$query = "SELECT * FROM discharge WHERE  month='$month'";


$result = mysql_query($query);

?>

<font color=green face="Lucida Fax"><h4>

<?php
$count2=1;
while($P_name_row = mysql_fetch_array($result,MYSQL_ASSOC))
{

$kaka2=$P_name_row[food];

if($kaka2=="Not_Recovred")
{
echo($count2);
echo(".");
echo($P_name_row[P_name]);
echo("   ID=");
echo($P_name_row[P_ID]);
echo("</br>");
echo("</br>");
$count2=$count2+1;
}

}
?></h4></font>

<font color=BLUE face="Lucida Fax"><h4>
<?php



echo(" NOTE : Total number of Not Recovered Patient  ");

echo(" in month ");
echo($month);
echo(" = ");
$count2=$count2-1;
echo($count2);

mysql_free_result($result);
 ?></h4></font>






<BR></BR>
<BR></BR>





<font color=green face="Lucida Fax"> Patient who are </font><font color=red face="Lucida Fax"><B>DISCONTINUED</B> </font>
<?php

$query = "SELECT * FROM discharge WHERE  month='$month'";


$result = mysql_query($query);

?>

<font color=green face="Lucida Fax"><h4>

<?php
$count3=1;
while($P_name_row = mysql_fetch_array($result,MYSQL_ASSOC))
{

$kaka3=$P_name_row[food];

if($kaka3=="Discontinued")
{
echo($count3);
echo(".");
echo($P_name_row[P_name]);
echo("   ID=");
echo($P_name_row[P_ID]);
echo("</br>");
echo("</br>");
$count3=$count3+1;
}

}
?></h4></font>


<font color= BLUE face="Lucida Fax"><h4>
<?php



echo(" NOTE : Total number of Discontinued Patient  ");

echo(" in month ");
echo($month);
echo(" = ");
$count3=$count3-1;
echo($count3);
mysql_free_result($result);
 ?></h4></font>

<br></br>
<br></br>
<br></br>


<h3><font color=green face="Lucida Fax"> See  </font><b><font color=red face="Lucida Fax">DISCHARGED INFO</font></b><font color=green face="Lucida Fax">of Patient by Patient ID</font></h3>
<h2><br><center>
<FORM METHOD=POST ACTION="RECOVERED.PHP">
Patient ID
<input type="text" name="P_ID">
<input type="submit" value="Search">
</form></br></center></h2>

</body>
</html>