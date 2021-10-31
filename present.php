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
$status=$_POST['status'];
$time=$_POST['time'];
$month=$_POST['month'];
$date=$_POST['date'];
$payment=$_POST['payment'];



$query="INSERT into present VALUES($P_ID,'$P_name','$status','$time','$month','$date',$payment)";
$result = mysql_query($query);


?>

<font color="blue"><h3>
<?php

echo("</br> Patient ID  = ");
echo($P_ID);

echo("</br> Patient name =");
echo($P_name);

echo("</br> Status =");
echo($status);

echo("</br> Timing =");
echo($time);

echo("</br> Month =");
echo($month);

echo("</br> Date =");
echo($date);

echo("</br> Payment =");
echo($payment);

?>
</h3></font>

</form>
<font color="red"> See all the above values are correct, if correct then proceed else again select or to fill other patient status</font><a href="fill_present_chart.html" target="MainFrame"><h2><font color="green">Fill Present Chart</font></a> 
</body>
</html>