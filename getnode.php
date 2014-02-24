<?php

$rel = $_GET['rel'];
$node = $_GET['node'];
$site = $_GET['site'];

$url = 'http://192.168.13.8:5000/api/v1/graph/'.$site.'/'.$node.'/'.$rel;
$curl = curl_init();
curl_setopt_array($curl, array(
    CURLOPT_RETURNTRANSFER => 1,
    CURLOPT_URL => $url,
    CURLOPT_USERAGENT => 'Codular Sample cURL Request'
));
$res = curl_exec($curl);
echo $res;
?>
