/*!
* Layout Engine v0.10.2
*
* Copyright (c) 2015-2016 Matt Stow
* http://mattstow.com
* Licensed under the MIT license
*/
var layoutEngine=(function(){var h=document.documentElement,n=h.style,o=" vendor-",c="edge",k="ie",i="khtml",g="mozilla",m="opera",a="webkit",q=" browser-",r="android",j="chrome",e="safari",d=e+"-ios",b="wiiu",f=o,p;if("msScrollLimit" in n||"behavior" in n){if("msTextSizeAdjust" in n&&!("msFlex" in n)){f+=c;p={vendor:c}}else{f+=k+o+k;p={vendor:k};if("msImeAlign" in n){f+="-11";p.version=11}else{if("msUserSelect" in n){f+="-10";p.version=10}else{if("fill" in n){f+="-9";p.version=9}else{if("widows" in n){f+="-8";p.version=8}else{f+="-7";p.version=7}}}}}}else{if("WebkitAppearance" in n){f+=a;var l=navigator.userAgent;p={vendor:a};if(!!window.chrome||l.indexOf("OPR")>=0||l.indexOf("wv")>=0){f+=q+j;p.browser=j}else{if("webkitDashboardRegion" in n){f+=q+e;p.browser=e}else{if("webkitOverflowScrolling" in n){f+=q+d;p.browser=d}else{if(l.indexOf("Android")>=0){f+=q+r;p.browser=r}else{if(!!window.wiiu){f+=q+b;p.browser=b}}}}}}else{if("MozAppearance" in n){f+=g;p={vendor:g}}else{if("OLink" in n||!!window.opera){f+=m;p={vendor:m,};if("OMiniFold" in n){f+="-mini";p.browser="mini"}}else{if("KhtmlUserInput" in n){f+=i;p={vendor:i}}else{return false}}}}}h.className+=f;return p})();