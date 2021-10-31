<html>
<body bgcolor="lightgray">
<center><h2><font color=red> The patient information</font></h2></center>

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





$P_name=$_POST['P_name'];




$query="SELECT * FROM patienta WHERE P_name = '$P_name'";
$result = mysql_query($query);

?>


<font color=black face="Lucida Fax"><b>
<?php
while($P_name_row = mysql_fetch_array($result,MYSQL_ASSOC))
{

$P_ID= $P_name_row["P_ID"];
$name= $P_name_row["P_name"];

$dr= $P_name_row["dr"];
$address= $P_name_row["address"];

$phone= $P_name_row["phone"];
$phone_home= $P_name_row["phone_home"];



$addm_date= $P_name_row["addm_date"];
$month= $P_name_row["month"];

$sex= $P_name_row["sex"];
$problem= $P_name_row["problem"];

$married= $P_name_row["married"];
$F_M_S= $P_name_row["F_M_S"];

$date_of_birth= $P_name_row["date_of_birth"];
$age= $P_name_row["age"];

$email= $P_name_row["email"];
$media= $P_name_row["media"];




echo("</br> Patient ID   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;=");
echo($P_ID);

echo("</br> Patient name &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;=");
echo($name);


echo("</br>Father/mother name &nbsp;&nbsp;=");
echo($F_M_S);

echo("</br> Sex of Patient&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;=");
echo($sex);

echo("</br> Married&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;=");
echo($married);




echo("</br> Date of Birth&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;=");
echo($date_of_birth);

echo("</br> Age of Patient&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; =");
echo($age);
echo("Years");



echo("</br> Mailing Address&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; =");
echo($address);

echo("</br> Email Address&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;=");
echo($email);



echo("</br> Phone number &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;=");
echo($phone);

echo("</br> Home Phone number&nbsp;&nbsp; =");
echo($phone_home);

echo("</br> Addmission Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; =");
echo($addm_date);

echo("</br> Month of Addmission  &nbsp;= ");
echo($month);

echo("</br> Chief Complaint&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;=");
echo($problem);


echo("</br> Reference Doctor&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; =");
echo($dr);

echo("</br> Patient Source&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;=");
echo($media);


echo("</br>");
echo("</br>");
echo("</br>");


}?></b></font>




</body>
</html>