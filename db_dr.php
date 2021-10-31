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

$dr = $_POST['dr1'];
$month=$_POST['month'];

$query = "SELECT * FROM patienta WHERE dr = '$dr' and month='$month'";


$result = mysql_query($query);

?>

<font color=green face="Lucida Fax"><h4>

<?php
$count=1;
while($P_name_row = mysql_fetch_array($result,MYSQL_ASSOC))
{
echo($count);
echo(".");
echo($P_name_row[P_name]);
echo("   ID=");
echo($P_name_row[P_ID]);
echo("</br>");
echo("</br>");
$count++;
}
?></h4></font>

<font color= red><h4>
<?php

echo("</br>");
echo("</br>");
echo(" NOTE : Total number of patient of ");
echo($dr);
echo(" in month ");
echo($month);
echo(" = ");
$count=$count-1;
echo($count);









 

mysql_free_result($result);
 ?></h4></font>

</body>
</html>