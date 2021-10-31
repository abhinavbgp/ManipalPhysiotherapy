<html>
<body bgcolor="lightgray">

<table border="1">
<tr>
<th>Name</th>
<th>Date</th>
<th>Status</th>
<th>Time</th>
<th>Month</th>
<th>Payment</th>
</tr>

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

$month = $_POST['month'];
$P_ID = $_POST['P_ID'];


$query = "SELECT * FROM present WHERE month = '$month'and P_ID = $P_ID";


$result = mysql_query($query);


?>
<h4><font color="blue"><?php



$sum=0;
while($P_name_row = mysql_fetch_array($result,MYSQL_ASSOC))
{
$name= $P_name_row["P_name"];
$date= $P_name_row["date"];
$status= $P_name_row["status"];
$time= $P_name_row["time"];
$month= $P_name_row["month"];
$payment= $P_name_row["payment"];
$sum=$sum+$P_name_row["payment"];

echo "<tr>";
echo "<td>$name</td>";
echo "<td>$date</td>";
echo "<td>$status</td>";
echo "<td>$time</td>";
echo "<td>$month</td>";
echo "<td>$payment</td>";
echo "</tr>";


}?></font></h4>
<h3><font color="blue">
<?php

echo("Total payment in this month</br>");
echo($month);
echo("</br>");

 


 ?></font></h3>
<h2><font color="red">
<?php
echo($sum);
mysql_free_result($result);
?></font></h2>
</body>
</html>