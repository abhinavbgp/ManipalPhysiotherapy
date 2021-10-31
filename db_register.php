<html>
<body bgcolor="lightgray">
<form>
<font color=red face="Lucida Fax"><h3>
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
$dr=$_POST['dr'];
$address=$_POST['address'];
$phone=$_POST['phone'];
$phone_home=$_POST['phone_home'];
$addm_date=$_POST['addm_date'];
$month=$_POST['month'];


$problem=$_POST['problem'];
$sex=$_POST['sex'];
$married=$_POST['married'];
$F_M_S=$_POST['F_M_S'];
$date_of_birth=$_POST['date_of_birth'];
$age=$_POST['age'];
$email=$_POST['email'];
$media=$_POST['food'];


$query1 = "SELECT * from patienta";

$result1 = mysql_query($query1);
while($P_name_row = mysql_fetch_array($result1,MYSQL_ASSOC))
{

$kaka1 = $P_name_row[P_ID];

if($kaka1=="$P_ID")
{
echo("Registration not successfull. The ID=");
echo($P_ID);
echo("Already exists!! Please try next ID . OR checkout this month Patients for to know last ID used");
echo("<a href=Patient_in_month.html>Patients in this month</a>");
}
else
{
//echo("<h4><font color=green  >Registration sucssesfull with Patient ID :</font></h4>");
$query="INSERT into patienta VALUES($P_ID,'$P_name','$dr','$address','$phone','$addm_date','$month','$phone_home','$problem','$sex','$married','$F_M_S','$date_of_birth','$age','$email','$media')";
$result = mysql_query($query);
}
}
?></h3></font>

<font color="black" face="Lucida Fax"><h4>
<?php
echo($P_ID);
echo("</br> Patient ID  = ");
echo($P_ID);

echo("</br> Patient name =");
echo($P_name);


echo("</br>Father/mother name=");
echo($F_M_S);

echo("</br> Sex=");
echo($sex);

echo("</br> Married=");
echo($married);




echo("</br> Date of Birth=");
echo($date_of_birth);

echo("</br> Age=");
echo($age);
echo("Years");



echo("</br> Address =");
echo($address);

echo("</br> Email Address=");
echo($email);



echo("</br> Phone number =");
echo($phone);

echo("</br> Home Phone number =");
echo($phone_home);

echo("</br> Addmission Date =");
echo($addm_date);

echo("</br> Month =          ");
echo($month);













echo("</br> Chief Complaint=");
echo($problem);


echo("</br> Reference Dr =");
echo($dr);

echo("</br> Patient Source=");
echo($media);







?>
</h4></font>

</form>
<font color="red"> See all the above values are correct, if correct then proceed else again select </font><a href="form.html" target="MainFrame"><h2><font color="green">Fill patient form</font></a> 
</body>
</html>