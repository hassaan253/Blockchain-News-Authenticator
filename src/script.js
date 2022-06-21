  function ascii_to_hex(str)
  {
	var arr1 = [];
	for (var n = 0, l = str.length; n < l; n ++) 
     {
		var hex = Number(str.charCodeAt(n)).toString(16);
		arr1.push(hex);
	 }
   num=arr1.join('')


  
         size=num.length;
       if(size<32){
       	for(let i = 0; i<(32-size); i++)
       	{		num+="0";
       
       	}
       }
    
     
     return '0x'+num;
     
  
   }


function hex2a(hex) 
{
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}
