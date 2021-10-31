<html>
<body bgcolor="lightgray">
<form>
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
$P_name=$_POST['P_name'];
$month=$_POST['month'];
$inprovement=$_POST['inprovement'];
$P_statement=$_POST['P_statement'];
$R_F_D=$_POST['R_F_D'];
$food=$_POST['food'];



$query="INSERT into discharge VALUES($P_ID,'$P_name','$inprovement','$P_statement','$R_F_D','$food','$month')";
$result = mysql_query($query);


?>

<font color="blue"><h4>
<?php

echo("</br> Patient ID  = ");
echo($P_ID);

echo("</br> Patient name =");
echo($P_name);

echo("</br> Discharged Month =");
echo($month);

echo("</br> Improvement =");
echo($inprovement);

echo("</br> Statement of Patient=");
echo($P_statement);

echo("</br> Reason for Discontinuation =");
echo($R_F_D);



?>
</h4></font>

</form>
<font color="red"> See all the above values are correct, if correct then proceed else again select </font><a href="Fill_Discharge.html" target="MainFrame"><h2><font color="green">Fill Discharge Form</font></a> 
</body>
</html>