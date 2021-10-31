<html>
<body bgcolor="lightgray">
<center><h2><font color=red face="Lucida Fax"> The Discharged information of Patient</font></h2></center>

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





$P_ID=$_POST['P_ID'];




$query="SELECT * FROM discharge WHERE P_ID = $P_ID";
$result = mysql_query($query);

?>


 <font color=green face="Lucida Fax">
<?php
while($P_name_row = mysql_fetch_array($result,MYSQL_ASSOC))
{

$P_ID= $P_name_row["P_ID"];
$name= $P_name_row["P_name"];
$food= $P_name_row["food"];
$month= $P_name_row["month"];


$inprovement= $P_name_row["inprovement"];
$P_statement= $P_name_row["P_statement"];
$R_F_D= $P_name_row["R_F_D"];








echo("</br> Patient ID   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;=");
echo($P_ID);

echo("</br> Patient name &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;=");
echo($name);

echo("</br>Status of Patient&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;=");
echo("<font color=red>");
echo($food);
echo("</font>");
echo("</br>Month of this Status&nbsp;&nbsp;&nbsp; =");
echo($month);

echo("</br>");
echo("</br>");


echo("</br><b><u>About Improvement </u>:</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");

?>
<font color=black face="Lucida Fax"><h4>
<?php
echo($inprovement);
?></h4></font>


<?php
echo("</br>");
echo("</br>");



echo("</br><b><u> Discharge Note</u>:<b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
?>
<font color=black face="Lucida Fax"><h4>
<?php
echo($P_statement);
?></h4></font>
<?php

echo("</br>");
echo("</br>");



echo("</br><b><u> Reason for Discont</u>:</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");

?>
<font color=black face="Lucida Fax"><h4>
<?php
echo($R_F_D);

?></h4></font>


<?php








}?></font>




</body>
</html>