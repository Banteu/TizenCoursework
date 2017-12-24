"use strict";
//http://remote-drawing-client.alexbelov.xyz/s/4d505f

var countOnBack = 0;

function WebConnection(token)
{
	
	this.token = token;
	
	// Download images 
	
	this.slideList = [];
	this.presentationName = "";
	this.presentationId = 0;		
	this.downloadedSlides = [];	
	this.downloadedCount = 0;	
	this.presentationCanvas = document.getElementById("presentationCanvas");  	
	this.presentationCanvas.width = 500;
	this.presentationCanvas.height = this.presentationCanvas.width * 9 / 16;	
	
	
	this.pContext = this.presentationCanvas.getContext("2d");   
	
	
	this.radius = 3;
	this.color = 0x00ff00;
	
	
	this.isDrawingLine = false;
	this.sx = 0;
	this.sy = 0;	
	this.lineId = 0;	
	this.aspect = 0;
	this.sizeRescale = 0;
		
	this.onLineStart = function(event)
	{
		var rect = this.presentationCanvas.getBoundingClientRect();
		var x = event.touches.item(0).clientX - rect.left;
		var y = event.touches.item(0).clientY - rect.top;
		this.isDrawingLine = true;
		this.sx = x;
		this.sy = y;
		countOnBack = 0;
		var xcrd = (x - this.xoffset) * this.sizeRescale / this.downloadedSlides[this.currentSlide].width;
		var ycrd = (y - this.yoffset) * this.sizeRescale / this.downloadedSlides[this.currentSlide].height;
		
		$.post("http://remote-drawing.alexbelov.xyz/api/presentations/"+this.presentationId+"/draw", {token:this.token, lineWidth:this.radius * this.sizeRescale, alpha:1, x:xcrd, y:ycrd, color:this.color, lineCode:this.lineId});

		var dtg = new Date();
		this.lastSend = dtg.getTime();
	}
	this.lineList = [];
	
	
	this.onLineEnd = function(event)
	{	
		this.isDrawingLine = false;
		this.lineId += 1;
	}
	
	
	
	this.drawAllLines = function()
	{		
		for (var i = 0; i < this.lineList.length; ++i)
		{
			this.pContext.beginPath();
			this.pContext.moveTo(this.lineList[i].sx, this.lineList[i].sy);			
			this.pContext.lineTo(this.lineList[i].ex, this.lineList[i].ey);
			this.pContext.strokeStyle = this.lineList[i].color;
			this.pContext.stroke();		
		}		
	};
	

	
	this.drawCallback = function(e)
	{
		
		this.pContext.beginPath();
		this.pContext.moveTo(this.sx, this.sy);
		var rect = this.presentationCanvas.getBoundingClientRect();
		var x = e.touches.item(0).clientX - rect.left;
		var y = e.touches.item(0).clientY - rect.top;	
		console.log(x + "  " + y);
		this.pContext.lineTo(x, y);
		this.pContext.strokeStyle = '#' + (('00000000' + this.color.toString(16)).substr(-6));
		this.pContext.lineWidth = this.radius;
		this.pContext.stroke();		
		this.sx = x;
		this.sy = y;
		
		var xcrd = (x - this.xoffset) * this.sizeRescale / this.downloadedSlides[this.currentSlide].width;
		var ycrd = (y - this.yoffset) * this.sizeRescale / this.downloadedSlides[this.currentSlide].height;
		
		var dtg = new Date();
				
		var ctime = dtg.getTime();
		
		
		if (ctime - this.lastSend > 100)
			{
				$.post("http://remote-drawing.alexbelov.xyz/api/presentations/"+this.presentationId+"/draw", {token:this.token, lineWidth:this.radius * this.sizeRescale, alpha:1, x:xcrd, y:ycrd, color:this.color, lineCode:this.lineId});
				this.lastSend = dtg.getTime();
			}
		}
	
	
	
	
	this.presentationCanvas.addEventListener('touchstart',this.onLineStart.bind(this));
	this.presentationCanvas.addEventListener('touchend',this.onLineEnd.bind(this));
	this.presentationCanvas.addEventListener('touchmove',this.drawCallback.bind(this));
	
	
	$("#increaseSize").bind('click', function(){this.radius += 1;countOnBack = 0;}.bind(this));
	$("#clearButton").bind('click', function(){this.render(); countOnBack = 0; $.post("http://remote-drawing.alexbelov.xyz/api/presentations/"+this.presentationId+"/clear",  {token:this.token} );}.bind(this));
	$("#greenButton").bind('click', function(){this.color = 0x00ff00;countOnBack = 0;}.bind(this));
	$("#redButton").bind('click', function(){this.color = 0xff0000;countOnBack = 0;}.bind(this));
	$("#blueButton").bind('click', function(){this.color = 0x0000ff;countOnBack = 0;}.bind(this));
	$("#scanButton").bind('click', function(){tau.changePage("CameraDiv"); qrScanner.tryScan(); countOnBack = 0;});
	
	
	
	$("#decreaseSize").bind('click', function(){
		if (this.radius == 1) return;
		this.radius -= 1;countOnBack = 0;}.bind(this));
	
	

	this.imageOnLoadEvent = function ()
	{
		this.downloadedCount += 1;
	};
	this.downloadChecker = function (){
		if (this.downloadedCount != this.slideList.length)
		{
			setTimeout(this.downloadChecker.bind(this), 5);
		}
		else
		{
			this.render();
			tau.changePage("PresentationPage");	
			
		}
	};
	
	this.nextButtonEvent = function ()
	{
		if (this.slideList.length > this.currentSlide + 1)
		{
			this.currentSlide += 1;
			$.post("http://remote-drawing.alexbelov.xyz/api/presentations/"+this.presentationId+"/slide/"+(this.currentSlide + 1), {token:this.token});
		}
		this.render();
		countOnBack = 0;
	};
	this.prevButtonEvent = function ()
	{
		if (this.currentSlide - 1 >= 0)
		{
			this.currentSlide -= 1;
			$.post("http://remote-drawing.alexbelov.xyz/api/presentations/"+this.presentationId+"/slide/"+(this.currentSlide + 1), {token:this.token});
		}
		this.render();
		countOnBack = 0;
	};
	
	this.nextButton = document.getElementById("nextSlide");
	this.nextButton.addEventListener('click', this.nextButtonEvent.bind(this));
	this.prevButton = document.getElementById("prevSlide");
	this.prevButton.addEventListener('click', this.prevButtonEvent.bind(this));
	
		
	
	this.currentSlide = 0;
	
	this.render = function()
	{
		
		var aspect = this.downloadedSlides[this.currentSlide].height / this.downloadedSlides[this.currentSlide].width;
		this.aspect = aspect;
		
		var slideWidth = this.downloadedSlides[this.currentSlide].width;
		var slideHeight = this.downloadedSlides[this.currentSlide].height;
		
		
		
		this.sizeRescale = Math.max(slideWidth / this.presentationCanvas.width, slideHeight / this.presentationCanvas.height);
		

		this.xoffset = (this.presentationCanvas.width - slideWidth / this.sizeRescale) * 0.5;
		this.yoffset = (this.presentationCanvas.height - slideHeight / this.sizeRescale) * 0.5;
		
		
		
		this.pContext.fillRect(0,0, this.presentationCanvas.width, this.presentationCanvas.height);
		this.pContext.drawImage(this.downloadedSlides[this.currentSlide], this.xoffset, this.yoffset, slideWidth / this.sizeRescale, slideHeight / this.sizeRescale);		
	};
	
	this.downloadImages = function()
	{
		for (var i = 0; i < this.slideList.length; ++i)
		{
			var url = this.slideList[i].fileUrl;
			this.downloadedSlides.push(new Image());	
			this.downloadedSlides[i].src = url;
			this.downloadedSlides[i].onload = this.imageOnLoadEvent.bind(this);
		}		
		setTimeout(this.downloadChecker.bind(this), 5);
	};
	
	
	
	this.responseCallback = function(response)
	{	
		console.log(response);
		this.slideList = response.Files;
		this.presentationName = response.name;
		this.presentationId = response.id;
		this.downloadImages();
	}	;
	
	
	$.get("http://remote-drawing.alexbelov.xyz/api/presentations/"+this.token, this.responseCallback.bind(this));
	
};

var cWebConn;


function callback(resl)
{
	$.post("http://remote-drawing.alexbelov.xyz/api/register-device/", {qrCode: resl}, function (tkr)
	{
		cWebConn = new WebConnection(tkr.token);
	});
};

function QrCodeScannerManager()
{
	this.height = 300;
	this.width = 350;
	this.graphicsContext = null;
}

( function createCamera()
{
	QrCodeScannerManager.prototype.createCameraWindow = function(sourceUrl)
	{
		
		var h = this.height;
		var w = this.width;
        this.video = $("#qrvideo").get(0);
        this.video.src = sourceUrl;
        this.video.autoplay = 'autoplay';
        this.video.width = w;
        this.video.height = h;
	}
	QrCodeScannerManager.prototype.qrCodeResult = function(resl)
	{
		alert(resl);
	};
		
	
	QrCodeScannerManager.prototype.tryScan = function()
	{
		if (!this.graphicsContext)
			{ return;}
		try{
            this.graphicsContext.drawImage(this.video,0,0, this.width, this.height);
            try{
                qrcode.decode();
            }
            catch(e){       
                console.log(e);
                setTimeout(this.tryScan.bind(this), 500);
            };
        }
        catch(e){       
                console.log(e);
                setTimeout(this.tryScan.bind(this), 500);
        };
	};
	
	
	
	QrCodeScannerManager.prototype.onCaptureVideoError = function(e)
	{
		this.graphicsContext = null;
		console.error(e);	
	}
	
	QrCodeScannerManager.prototype.onCaptureVideoSuccess = function(stream)
	{
        var urlStream = null;

        urlStream = window.webkitURL.createObjectURL(stream);
        this.isMediaWorking = true;
        this.createCameraWindow(urlStream);
	};
	
	QrCodeScannerManager.prototype.createInitialCanvas = function()
	{
	    var gCanvas = document.getElementById("qr-canvas");
	    gCanvas.style.width = this.width + "px";
	    gCanvas.style.height = this.height + "px";
	    gCanvas.width = this.width;
	    gCanvas.height = this.height;
	    this.graphicsContext = gCanvas.getContext("2d");
	    this.graphicsContext.clearRect(0, 0, this.width, this.height);
	    
	    qrcode.callback = callback;
	}
	
	
	QrCodeScannerManager.prototype.startQrSearch = function()
	{
		var CaptureOptions = 
		{
			audio:false,
			video:true,
			facingMode: "environment"
		};
		
		navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia;
		try {
			if (typeof (navigator.getUserMedia) === 'function') {
				// ask user to grant permissions to use media objects
				navigator.getUserMedia(CaptureOptions,
						this.onCaptureVideoSuccess.bind(this),
						this.onCaptureVideoError.bind(this));
			}
		} catch (e) {
			alert('navigator.getUserMedia() error.');
			console.error('navigator.getUserMedia() error: ' + e.message);		
		}
	};
	
	QrCodeScannerManager.prototype.init = function()
	{
		this.startQrSearch();
		this.createInitialCanvas();
		this.tryScan();
	};
	
}());

( function () {
    window.addEventListener( 'tizenhwkey', function( ev ) {
        if( ev.keyName === "back" ) {
        	console.log(countOnBack);
        	countOnBack++;
        	if (countOnBack == 2)
        		{
        			tizen.application.getCurrentApplication().exit();        		
        		}
        }
    } );
} () );


var qrScanner = new QrCodeScannerManager();
$(document).ready(function startCameraQr(){
	qrScanner.init();
});

