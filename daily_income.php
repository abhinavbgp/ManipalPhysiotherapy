<html>
<body>



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

$date = $_POST['date'];



$query = "SELECT * FROM present WHERE date = '$date'";


$result = mysql_query($query);







$sum=0;
while($P_name_row = mysql_fetch_array($result,MYSQL_ASSOC))
{

$payment= $P_name_row["payment"];
$sum=$sum+$P_name_row["payment"];

}


?>
<h3><font color="blue">
<?php

echo("Total payment of  ");
echo($date);
echo("</br>");

 


 ?></font></h3>
<h2><font color="red">
<?php
echo($sum);
mysql_free_result($result);
?></font></h2>
</body>
</html>