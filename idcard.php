<html>
<body bgcolor="lightgray">
<style type="text/css">
 h1.h11{
            position:absolute;
            left:150px;
            top:100px;
         }

h2.h22{
            position:absolute;
            left:521px;
            top:111px;
            }
h3.h33{
            position:absolute;
            left:500px;
            top:87px;
            }

h4.h44{
            position:absolute;
            left:300px;
            top:110px;
            }
</style>




<h1 class="h11"><img src="ID.jpg"></h1>
<?php

$P_ID=$_POST['P_ID'];
$P_name=$_POST['P_name'];
$dr=$_POST['dr'];
$date=$_POST['date'];
$phone=$_POST['phone'];
$address=$_POST['address'];
$problem=$_POST['problem'];

?>
<h2 class="h22">
<?php
$kkk=$_FILES["photo"]["name"];

echo("<img src=$kkk height=140 width=118>");


?></h2>

<h3 class="h33">
<?php
echo($P_ID);

?>
</h3>


<font color="blue">
<h4 class="h44">
<?php
echo($P_name);
echo("</br>");
echo($dr);
echo("</br>");

echo($date);
echo("</br>");

echo($problem);

echo("</br>");
echo($phone);

echo("</br>");

echo($address);
?></h4></font>


</html>
</body>