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


<font color=green face="Lucida Fax">Total patient from </font><font color=red face="Lucida Fax"><B>MEDIA</B> </font>

<?php

$query = "SELECT * FROM patienta WHERE  month='$month'";
$result = mysql_query($query);

$count1=0;

while($P_name_row = mysql_fetch_array($result,MYSQL_ASSOC))
{

$kaka1=$P_name_row[media];

if($kaka1=="Media")
{
$count1=$count1+1;

}

}

mysql_free_result($result);
?>
<font color= red><h2>
<?php

echo($count1);

?></h4></font>



<font color=green face="Lucida Fax">Total patient from </font><font color=red face="Lucida Fax"><B>RELATIVES </B></font>

<?php

$query = "SELECT * FROM patienta WHERE  month='$month'";
$result = mysql_query($query);

$count2=0;

while($P_name_row = mysql_fetch_array($result,MYSQL_ASSOC))
{

$kaka2=$P_name_row[media];

if($kaka2=="Relatives")
{
$count2=$count2+1;

}

}

mysql_free_result($result);
?>
<font color= red><h2>
<?php

echo($count2);

?></h4></font>

<font color=green face="Lucida Fax">Total patient from </font><font color=red face="Lucida Fax"><B>PATIENTS<B> </font>

<?php

$query = "SELECT * FROM patienta WHERE  month='$month'";
$result = mysql_query($query);

$count3=0;

while($P_name_row = mysql_fetch_array($result,MYSQL_ASSOC))
{

$kaka3=$P_name_row[media];

if($kaka3=="Patients")
{
$count3=$count3+1;

}

}

mysql_free_result($result);
?>
<font color= red><h2>
<?php

echo($count3);

?></h4></font>
<font color=green face="Lucida Fax">Total patient from </font><font color=red face="Lucida Fax"><B>DOCTOR</B> </font>

<?php

$query = "SELECT * FROM patienta WHERE  month='$month'";
$result = mysql_query($query);

$count4=0;
while($P_name_row = mysql_fetch_array($result,MYSQL_ASSOC))
{

$kaka4=$P_name_row[media];

if($kaka4=="Doctor")
{
$count4=$count4+1;

}

}

mysql_free_result($result);
?>
<font color= red><h2>
<?php

echo($count4);

?></h4></font>


<font color=green face="Lucida Fax">Total patient from </font><font color=red face="Lucida Fax"><B>SELF </B></font>

<?php

$query = "SELECT * FROM patienta WHERE  month='$month'";
$result = mysql_query($query);

$count5=0;

while($P_name_row = mysql_fetch_array($result,MYSQL_ASSOC))
{

$kaka5=$P_name_row[media];

if($kaka5=="Self")
{
$count5=$count5+1;

}

}

mysql_free_result($result);
?>
<font color= red><h2>
<?php

echo($count5);

?></h4></font>


<font color=green face="Lucida Fax">Total patient from </font><font color=red face="Lucida Fax"><B>ADVERTISEMENTS </B></font>

<?php

$query = "SELECT * FROM patienta WHERE  month='$month'";
$result = mysql_query($query);

$count6=0;

while($P_name_row = mysql_fetch_array($result,MYSQL_ASSOC))
{

$kaka6=$P_name_row[media];

if($kaka6=="Advertisements")
{
$count6=$count6+1;

}

}

mysql_free_result($result);
?>
<font color= red><h2>
<?php

echo($count6);

?></h4></font>





</body>
</html>