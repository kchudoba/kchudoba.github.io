var portfolio=[];

getUserPortfolio();
function touchZoomPlugin(opts) {
				function init(u, opts, data) {
					let plot = u.root.querySelector(".u-over");
					let rect, oxRange, oyRange, xVal, yVal;
					let fr = {x: 0, y: 0, dx: 0, dy: 0};
					let to = {x: 0, y: 0, dx: 0, dy: 0};
					let fpos = {f1x:0, f1y:0, f2x:0, f2y:0};

					function storePos(t, e) {
						let ts = e.touches;

						let t0 = ts[0];
						let t0x = t0.clientX - rect.left;
						let t0y = t0.clientY - rect.top;
						
						fpos.f1x=t0x;
						fpos.f1y=t0y;

						if (ts.length == 1) {
							t.x = t0x;
							//t.y = t0y;
							t.d = t.dx = t.dy = 1;
							
							u.setCursor({"left": fpos.f1x, "top": -10});
						}
						else {
							let t1 = e.touches[1];
							let t1x = t1.clientX - rect.left;
							let t1y = t1.clientY - rect.top;
							
							fpos.f2x=t1x;
							fpos.f2y=t1y;
							u.setSelect({"left": Math.min(fpos.f1x,fpos.f2x), "top": 0,"width": Math.max(fpos.f1x,fpos.f2x)-Math.min(fpos.f1x,fpos.f2x),"height":300});
	
	
	u.root.children[1].children[1].children[1].innerHTML=	(100*(u.data[1][u.posToIdx(Math.max(t0x,t1x))]-u.data[1][u.posToIdx(Math.min(t0x,t1x))])/(u.data[1][u.posToIdx(Math.min(t0x,t1x))])).toFixed(2)+"%";
	u.root.children[1].children[0].children[1].innerHTML="Change:";

							let xMin = Math.min(t0x, t1x);
							let yMin = Math.min(t0y, t1y);
							let xMax = Math.max(t0x, t1x);
							let yMax = Math.max(t0y, t1y);

							// midpts
							t.y = (yMin+yMax)/2;
							t.x = (xMin+xMax)/2;

							t.dx = xMax - xMin;
							t.dy = yMax - yMin;

							// dist
							t.d = Math.sqrt(t.dx * t.dx + t.dy * t.dy);
						}
					}

					let rafPending = false;

					function zoom() {
						rafPending = false;

						let left = to.dx;
						let top = to.dy;

						//
						
						// non-uniform scaling
						let xFactor = fr.dx / to.dx;
						//let yFactor = fr.dy / to.dy;
						let yFactor =1;

						// uniform x/y scaling
						//let xFactor = fr.d / to.d;
						//let yFactor = fr.d / to.d;

						let leftPct = left/rect.width;
						let btmPct = 1 - top/rect.height;

						let nxRange = oxRange * xFactor;
						let nxMin = xVal - leftPct * nxRange;
						let nxMax = nxMin + nxRange;

						let nyRange = oyRange * yFactor;
						let nyMin = yVal - btmPct * nyRange;
						let nyMax = nyMin + nyRange;

						
						u.batch(() => {
							/*u.setScale("x", {
								min: nxMin,
								max: nxMax,
							});*/

							/*u.setScale("y", {
								min: nyMin,
								max: nyMax,
							});*/
						});
					}

					function touchmove(e) {
						storePos(to, e);

						if (!rafPending) {
							rafPending = true;
							requestAnimationFrame(zoom);
						}
					}

					plot.addEventListener("touchstart", function(e) {
						rect = plot.getBoundingClientRect();

						storePos(fr, e);

						oxRange = u.scales.x.max - u.scales.x.min;
						oyRange = u.scales.y.max - u.scales.y.min;

						let left = fr.x;
						let top = fr.y;

						xVal = u.posToVal(left, "x");
						yVal = u.posToVal(top, "y");

						document.addEventListener("touchmove", touchmove, {passive: true});
					});

					plot.addEventListener("touchend", function(e) {
						document.removeEventListener("touchmove", touchmove, {passive: true});
					});
				}

				return {
					hooks: {
						init
					}
				};
			}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


//Date utils for yahoo and for charts
function getRemoteDateTime(offset/*ms*/,date=new Date()){ 
let NYD =new Date(date.getTime()+parseInt(offset)); 
return {
	"year": NYD.getUTCFullYear(),
	"month":NYD.getUTCMonth(),
	"date": NYD.getUTCDate(),
	"hour":NYD.getUTCHours(),
	"minute":NYD.getUTCMinutes(),
	"dayofweek":NYD.getUTCDay(),
	};
}

function getUTCfromRemote(offset,year,month,date,hour=0,minute=0){
return new Date(Date.UTC(year,month,date,hour,minute)-parseInt(offset));
}

////Array utils
Array.prototype.cleanNull = function(){
//var result = []
    for(var i = 0; i < this.length; i++) {
        if( !this[i] ) this[i]=this[i-1];
    }
return this;
}

Array.prototype.vectorAdd = function(other){
var result = []
    for(var i = 0; i < this.length; i++) {
        result.push( this[i] + other[i])
    }

    return result;
}

var charts= new Map();;

/*function addChart(symbol,node,interval="2m", range="2d"){
	
	fetch("https://jsonp.afeld.me/?url="+ encodeURIComponent("https://query1.finance.yahoo.com/v8/finance/chart/"+symbol+"?interval=5m&range="+range+"&includePrePost=true"))
		.then(response => response.json())
		.then(result => {
			timestp=result.chart.result[0].timestamp;
			closeprices=result.chart.result[0].indicators.quote[0].close;
			closeprices.cleanNull();
			
			if (!charts.has(symbol)) {
				charts.set(symbol,plotChart(timestp,closeprices,node,symbol+"ch"));
			}else{
				charts.get(symbol).setData([timestp,closeprices]);
				charts.get(symbol).redraw();
			}

	});

}*/

//var preTimestamps = [];
function isInMarket(tsp,tradeperiods){

	for (tp of tradeperiods){
		if(tsp>= tp[0].start && tsp<=tp[0].end){
			return true;
		}
	}
	return false;		
}


///////MAIN CHART FUNCTION
function addChartRange(symbol,node,offset,regMT,range=1){

	let mt=getRemoteDateTime(offset,new Date(regMT*1000));

	prestart=parseInt(getUTCfromRemote(offset,mt.year,mt.month,mt.date,4,0)/1000)-(range-1)*24*60*60;
	now=parseInt(new Date()/1000);
	//Valid intervals: [1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo]
	interval="1m";
	if(range>=5) interval="5m";
	if(range>=30) interval="30m";
	if(range>=60) interval="1h";
	if(range>=190) interval="1d";

	
	prepost=document.getElementById("prepost").checked;

//	let proxy="https://jsonp.afeld.me/?url=";
	//let churl="https://query1.finance.yahoo.com/v8/finance/chart/"+symbol+"?interval="+interval+"&period1="+prestart+"&period2="+now+"&includePrePost="+prepost;
	let churl="https://y.krz.workers.dev/y/ch/"+symbol+"?interval="+interval+"&period1="+prestart+"&period2="+now+"&includePrePost="+prepost;
	
	
	//fetch("https://jsonp.afeld.me/?url="+ encodeURIComponent("https://query1.finance.yahoo.com/v8/finance/chart/"+symbol+"?interval=5m&range="+range+"&includePrePost=true"))
	//fetch(proxies[0]+encodeURIComponent(churl))
	fetch(/*proxies[0]+*/churl)
		.then(response => response.json())
		.then(result => {
			timestp=result.chart.result[0].timestamp;
			closeprices=result.chart.result[0].indicators.quote[0].close;
			closeprices.cleanNull();
			//testing new series
			
			premarketts=[];
			postmarketts=[];
			if(interval!="1d" && range<180 && prepost){
				pretp=result.chart.result[0].meta.tradingPeriods.pre;
				premarketts=timestp.map((v,i) => isInMarket(v,pretp)? closeprices[i]:null);
				posttp=result.chart.result[0].meta.tradingPeriods.post;
				postmarketts=timestp.map((v,i) => isInMarket(v,posttp)? closeprices[i]:null);
			}
			
			if (!charts.has(symbol)) {
				charts.set(symbol,plotChart(timestp,closeprices,node,symbol+"ch",premarketts, postmarketts, getCost(symbol,timestp)));//added the series
			}else{
				charts.get(symbol).origLength=timestp.length;
				//charts.get(symbol).chosenrange=range;
				charts.get(symbol).setData([timestp,closeprices,premarketts, postmarketts,getCost(symbol,timestp)]);
		
			}
				charts.get(symbol).chosenrange=range;

			
			
	});

}

function getCost(symbol, timestamps){
	lsres=getHolding(symbol);
	if(lsres && document.getElementById("costline").checked){
		if(lsres.p>0){
			return timestamps.map(x=>lsres.p);
		}
	}
	return [];
}


function toggle(e){
ele=this;
   //console.log(e.target);
   /*

   speechSynthesis.cancel(); 
   var tex = "Hello there!"; 
   var u=new SpeechSynthesisUtterance(); u.lang='en-US';u.rate=1; u.text=tex; u.onstart = function(event) { resumeInfinity(); }; u.onend = function(event) { clearTimeout(timeoutResumeInfinity); };window.speechSynthesis.speak(u);*/
   
   
if(ele.nextSibling.style.display=="" ){
	ele.nextSibling.style.display="block"; 
	//addChart(ele.id,ele.nextSibling);
	addChartRange(ele.id,ele.nextSibling,ele.dataset.gmtoffset,ele.dataset.regMarketTime);

}else {
	ele.nextSibling.style.display="";
	//ele.nextSibling.innerHTML="";
}
console.log(getHolding(ele.id));
document.getElementById("hsymb").value=ele.id;
document.getElementById("hprice").value=getHolding(ele.id).p;
document.getElementById("hnumber").value=getHolding(ele.id).n;


}

function floatToLength(num,maxLength,maxPrecision){
	if(num){
		return num.toFixed(Math.max(0,Math.min(maxPrecision,maxLength-parseInt(Math.abs(num)).toString().length)))
	}
	return "&nbsp;N/A&nbsp;";
}

function colorDiv(div, val, maxAt){
	if (val>0){
		intensity=Math.min(parseInt(val*(200/maxAt)),200);
		div.style.backgroundColor="rgb(0,"+intensity+",0)";
	}else {
		intensity=Math.min(parseInt(Math.abs(val)*(255/maxAt)),255);
		div.style.backgroundColor="rgb("+intensity+",0,0)";
		//d.nextSibling.style.backgroundImage= "linear-gradient(rgb("+red+",0,0),black,black, black)";
	}
}

function addStock(quote){
	
	// CREATING DIVS IF NOT EXISTING
	d=document.getElementById(quote.symbol);
	if(!d){ //
		d=document.createElement("div");
		d.id=quote.symbol;
		d.className="stock";
		document.getElementById("container").appendChild(d);
		d.appendChild(document.createElement("div")).className="data";
		d.appendChild(document.createElement("div")).className="data";
		d.appendChild(document.createElement("div")).className="data";
		d.appendChild(document.createElement("div")).className="data";
		d.appendChild(document.createElement("div")).className="data";
		d.appendChild(document.createElement("div")).className="data";
		d.appendChild(document.createElement("div")).className="data";
		d.appendChild(document.createElement("div")).className="data";
		ch=document.createElement("div");
		ch.className="chart";
		d.after(ch);
		
		chartcontrols=document.createElement("div");
		chartcontrols.className="chartcontrols";
		chartcontrols.innerHTML="<div>1d</div><div>2d</div><div>1w</div><div>2w</div><div>1m</div><div>3m</div><div>6m</div><div>1y</div><div>5y</div>";
		ch.appendChild(chartcontrols);
		
		chartcontrolsover=document.createElement("div");
		chartcontrolsover.className="chartcontrolsover";
		chartcontrolsover.dataset.symbol=quote.symbol;
		chartcontrolsover.innerHTML="<div data-range='1'></div><div data-range='2'></div><div data-range='7'></div><div data-range='14'></div><div data-range='30'></div><div data-range='91'></div><div data-range='183'></div><div data-range='365'></div><div data-range='1826'></div>";
		ch.appendChild(chartcontrolsover);
		
		priceinchart=document.createElement("div");
		priceinchart.className="priceinchart";
		priceinchart.innerHTML="----.--";
		ch.appendChild(priceinchart);
		
		d.dataset.gmtoffset=quote.gmtOffSetMilliseconds;
		d.dataset.regMarketTime=quote.regularMarketTime;
		
		d.onclick=toggle;
		let touchstartms=0;
		
		/*d.ontouchstart=(e)=>{
			touchstartms=new Date();
			setTimeout(()=>{if(touchstartms>0) alert("long press");touchstartms=0;},1000)
		
		};
		d.ontouchend=(e)=>{
			touchstartms=0;
			//if((new Date()-touchstartms)>500 ) {alert("long press"); touchstartms=0;}
			};
		*/
		
		// Chart period events
		chartcontrolsover.onclick=(e)=>{
			let range=e.target.dataset.range;
			addChartRange(quote.symbol,ch,quote.gmtOffSetMilliseconds,quote.regularMarketTime,range);
			console.log(e);
		}
		
	}
	// IF DIVS EXIST, FILL WITH DATA
	if(d){
		
		//DETERMINING WHICH PRICE TO USE
		if(quote.marketState=="PRE" && quote.preMarketPrice){
			price= quote.preMarketPrice;
			change=quote.preMarketChangePercent;
			markettime=quote.preMarketTime;
			chartseries=2;
		}else if(["PREPRE","POST","POSTPOST","CLOSED"].includes(quote.marketState) &&  quote.postMarketPrice){
			price= quote.postMarketPrice;
			//change=quote.postMarketChangePercent;
			change=100*(quote.postMarketChange+quote.regularMarketChange)/quote.regularMarketPreviousClose;
			markettime=quote.postMarketTime;
			chartseries=3;
		}
		else{
			price= quote.regularMarketPrice;
			change=quote.regularMarketChangePercent;
			markettime=quote.regularMarketTime;
			chartseries=1;
		}
		
		d.nextSibling.children[2].style.color=change<0 ? "rgb(234,0, 0,0.48)" : "rgb(0,234, 0,0.48)";
		d.nextSibling.children[2].innerHTML=price.toFixed(2);
		
		// FILLING IN THE DATA
		d.children[0].innerHTML="<div>"+quote.symbol +"</div>" ;
		d.children[1].innerHTML="<div class='mk"+chartseries+"'>"+price.toFixed(2)+"</div><div class='mk"+chartseries+"'>"+change.toFixed(2)+"%"+"</div>";
		d.children[2].innerHTML="<div>"+quote.fiftyDayAverage.toFixed(2)+"</div><div>"+(100*quote.fiftyDayAverageChangePercent).toFixed(2)+"%"+"</div>";
d.children[3].innerHTML="<div>"+quote.twoHundredDayAverage.toFixed(2)+"</div><div>"+(100*quote.twoHundredDayAverageChangePercent).toFixed(2)+"%"+"</div>";
		d.children[4].innerHTML="<div>"+floatToLength(quote.fiftyTwoWeekHigh,4,2)+"</div><div>"+floatToLength(100*quote.fiftyTwoWeekHighChangePercent,3,1)+"%"+"</div>";
		d.children[5].innerHTML="<div>"+floatToLength(quote.fiftyTwoWeekLow,4,2)+"</div><div>"+floatToLength(100*quote.fiftyTwoWeekLowChangePercent,3,1)+"%"+"</div>";
		d.children[6].innerHTML="<div>"+floatToLength(quote.trailingPE,4,2)+"</div><div>"+floatToLength(quote.forwardPE,4,2)+"</div>";
		d.children[7].innerHTML="<div>"+floatToLength(quote.priceToBook,3,2)+"</div>";


		//Coloring 
		colorDiv(d.children[0],change,10);
		colorDiv(d.children[1],change,10);
		colorDiv(d.children[2],100*quote.fiftyDayAverageChangePercent,20);
		colorDiv(d.children[3],100*quote.twoHundredDayAverageChangePercent,100);
		colorDiv(d.children[4],100*quote.fiftyTwoWeekHighChangePercent,100);
		colorDiv(d.children[5],100*quote.fiftyTwoWeekLowChangePercent,200);
		//colorDiv(d.children[6],100*quote.fiftyTwoWeekHighChangePercent,100);
		//colorDiv(d.children[7],100*quote.fiftyTwoWeekHighChangePercent,100);



		
		//updating chart
		if (charts.has(quote.symbol) && d.nextSibling.style.display=="block" && !charts.get(quote.symbol).data[0].includes(markettime) && document.getElementById("liveup").checked){
			charts.get(quote.symbol).data[0].push(markettime);
			charts.get(quote.symbol).data[1].push(price);
			
			chartseries>1 ? charts.get(quote.symbol).data[chartseries].push(price) : null;

			charts.get(quote.symbol).setData(charts.get(quote.symbol).data);
		}
		
		
		
		
	}
				

}


const proxies=["https://secret-tundra-11774.herokuapp.com/","http://www.whateverorigin.org/get?url=","https://jsonp.afeld.me/?url="];


var winactive=true;
var marketactive=true;

function loadQuotes(){
	
	if (winactive){
	
		// ((window.location.hostname!="")?(fetch('https://jsonp.afeld.me/?url='+encodeURIComponent('https://query1.finance.yahoo.com/v7/finance/quote'+window.location.search))):(fetch('https://query1.finance.yahoo.com/v7/finance/quote'+window.location.search)))
		
		//((window.location.hostname!="")?(fetch(proxies[0]+/*encodeURIComponent(*/'https://query1.finance.yahoo.com/v7/finance/quote?symbols='+getWatchlist()/*)*/)):(fetch('https://query1.finance.yahoo.com/v7/finance/quote?symbols='+getWatchlist())))
		
		((window.location.hostname!="")?(fetch('https://y.krz.workers.dev/y/q?symbols='+getWatchlist())):(fetch('https://query1.finance.yahoo.com/v7/finance/quote?symbols='+getWatchlist())))
		.then(response => response.json())
		.then(result => {
			quotes=result.quoteResponse.result;
			let mactive=false;
			for(quote of quotes){
				addStock(quote);
				
				if(["PRE","POST","REGULAR"].includes(quote.marketState)) mactive=true;
			
			}
			mactive ? marketactive=true : marketactive=false;
			speak(quotes);
			calcPortfolio(quotes);
	});
		//console.log(setTimeout(function(){loadQuotes();}, marketactive ? 2000 : 60000));
		setTimeout(function(){loadQuotes();}, marketactive ? 2000 : 60000);
	}

}

function init(){
	document.getElementById("portfoliocontrols").onclick=(e)=>{
			let range=e.target.dataset.range;
			getAllStocks(range);
			//console.log(e);
		}
	speechSynthesis.cancel();
	loadQuotes();
	document.getElementById("ver").innerHTML="v1.2";
	if(!pchart) getAllStocks(1);
}

////////////////////////
//SPEAKING FUNCTIONALITY
var timeoutResumeInfinity=0;
function resumeInfinity() { window.speechSynthesis.resume(); timeoutResumeInfinity = setTimeout(resumeInfinity, 2000); }


var utt=new SpeechSynthesisUtterance(); 
utt.lang='en-GB';
utt.rate=1;
utt.onstart = function(event) { resumeInfinity(); }; 
utt.onend = function(event) { clearTimeout(timeoutResumeInfinity); };
utt.text="Hello trader";

function getRandomWord(words) {
    return words[Math.floor(Math.random() * words.length)];
}

function speak(quotes){

	if(window.speechSynthesis.speaking || !document.getElementById("spk").checked){
		//console.log("speaking:" +window.speechSynthesis.speaking + " checked:"+ document.getElementById("spk").checked);
		
	}else{
	
	let price, change, market;
	
	function getmarketprice(quote){
		if(quote.marketState=="PRE" && quote.preMarketPrice){
			price= quote.preMarketPrice;
			change=quote.preMarketChangePercent;
			market="pre-market";
		}else if(["PREPRE","POST","POSTPOST","CLOSED"].includes(quote.marketState) &&  quote.postMarketPrice){
			price= quote.postMarketPrice;
			//change=quote.postMarketChangePercent;
			change=100*(quote.postMarketChange+quote.regularMarketChange)/quote.regularMarketPreviousClose;
			market="after hours trading";
		}
		else{
			price= quote.regularMarketPrice;
			change=quote.regularMarketChangePercent;
			market="regular session";
		}
	}
	// idea: save last spoken change and speak only if the new one is significant 
	let text="";
	let prestocks=[];
	let poststocks=[];
	textpre="";
	textpost="";
	
	function changetotext(change){
	 return (change>0 ? (change>5 ? getRandomWord([" stock surged "," shares shoot up "," stock jumped up "]): getRandomWord([" is up "," rose ", " jumped "])) : (change<-5 ? getRandomWord([" shares fell "," stock dropped ", " shares plummetted "] ): getRandomWord([" is down "," lost ", " shares shrink "])))+ Math.abs(change.toFixed(1)) + " percent. ";
	}
	for(q of quotes){
		//text+=q.displayName? q.displayName: q.shortName;
		getmarketprice(q);
		if(market=="pre-market") textpre+= (q.displayName? q.displayName: q.shortName) + changetotext(change);
		if(market=="regular session") text+= (q.displayName? q.displayName: q.shortName) +changetotext(change);
		if(market=="after hours trading") textpost+= (q.displayName? q.displayName: q.shortName) +changetotext(change);
		

	}
	//console.log(text);
	 utt.text=  (textpre.length>0? "In the pre-market session, "+textpre :"") + (textpost.length>0? "In the after-hour trading, "+textpost : "")+(text.length>0 ? "In the regular trading session, " + text : ""); 
	 //window.speechSynthesis.cancel();
	 window.speechSynthesis.speak(utt);
	 }
}
var skipcount=4;//for live portfolio chart


function calcPortfolio(quotes){
	let price, changep, change, market;
	let sum=0;
	let sumchange=0;
	let invested=0;
	let chper=0;
	function getmarketprice(quote){
		if(quote.marketState=="PRE" && quote.preMarketPrice){
			price= quote.preMarketPrice;
			changep=quote.preMarketChangePercent;
			market="pre-market";
			change=quote.preMarketChange;
		}else if(quote.marketState=="PRE" && !quote.preMarketPrice){
			price= quote.regularMarketPrice;
			changep=0;
			market="pre-market";
			change=0;
		}else if(["PREPRE","POST","POSTPOST","CLOSED"].includes(quote.marketState) &&  quote.postMarketPrice){
			price= quote.postMarketPrice;
			//changep=quote.postMarketChangePercent;
			changep=100*(quote.postMarketChange+quote.regularMarketChange)/quote.regularMarketPreviousClose;
			market="after hours trading";
			change=quote.postMarketChange+quote.regularMarketChange;
		}
		else{
			price= quote.regularMarketPrice;
			changep=quote.regularMarketChangePercent;
			market="regular session";
			change=quote.regularMarketChange;
		}
	}
	
	for(q of quotes){
		//text+=q.displayName? q.displayName: q.shortName;
		getmarketprice(q);
		sum=sum+price*getHolding(q.symbol).n;
		sumchange=sumchange+change*getHolding(q.symbol).n;
		chper=100*sumchange/(sum-sumchange);
		invested=invested + getHolding(q.symbol).n*getHolding(q.symbol).p;
	}
	document.getElementById("portfolio").innerHTML="Portfolio: "+sum.toFixed(2)+" Change: "+sumchange.toFixed(2)+ " "+chper.toFixed(2)+"% P/L: "+(sum-invested).toFixed(2);
	
	skipcount++;
	if(pchart && skipcount>4){
	pchart.data[0].push((new Date()).getTime()/1000);
	pchart.data[1].push(sum);
	document.getElementById("costline").checked ? pchart.data[4].push(invested):null;
	pchart.setData(pchart.data);
	skipcount=0;
	}
	
}

function getHolding(symbol){
	
	/*let holding=JSON.parse(localStorage.getItem(symbol));
	if (holding==null) holding={"price":0,"number":0};
	return holding;
	*/
	for(stock of portfolio){
		if(stock.s==symbol) return stock;
	}
	return null;
}

function getWatchlist(){
	
	ls_keys=portfolio.map(x=>x.s);//Object.keys(localStorage);
	//if(window.location.search=="") window.location.search="?symbols=TSLA,AAPL,MSFT,AMZN,NVDA,NFLX,T,AVGO,INTC,WMT,FB"
	if (ls_keys==""){
		
		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);
		ls_keys=urlParams.get("symbols");
		if (ls_keys) return ls_keys.toString();
		else return "";

	}   
	let portf=[];
	let watchl=[];
	for ( stock of portfolio/*k of ls_keys*/){
		//let h=JSON.parse(localStorage.getItem(k));
		
		if(stock.n>0) portf.push(stock)//[k,h])
			else watchl.push(stock.s);//k);
	}
	portf.sort((a,b)=>{return (b.p*b.n)-(a.p*a.n)});
	watchl.sort();
	return portf.map(x=>x.s).concat(watchl).join();
}


function getSize() {
	//alert(window.visualViewport.width);
	return {
		width: document.documentElement.clientWidth,
		height: 180,
	}
}
function throttle(cb, limit) {
	var wait = false;

	return () => {
		if (!wait) {
			requestAnimationFrame(cb);
			wait = true;
			setTimeout(() => {
				wait = false;
			}, limit);
		}
	}
}

function plotChart(timestamps, priceseries, target,chartid, preseries=[null],postseries=[null],cost=[]){
/*if(document.getElementById("chart1")){
document.getElementById("chart1").remove();
}*/
	
	
	let data = [
	  timestamps,    // x-values (timestamps)
	  priceseries,    // y-values (series 1)
	  preseries,
	  postseries,
	  cost
	];
	
	let opts = {
  id: chartid,
  tzDate: ts => uPlot.tzDate(new Date(ts * 1e3), "America/New_York"),
  class: "my-chart",
  ...getSize(),
	plugins: [
						touchZoomPlugin()
					],
	series: [
		{
			spanGaps: false,
		},
		{
			show: true,
			//spanGaps: false,
			// in-legend display
			label: "Price",
			value: (self, rawValue) => "$" + rawValue.toFixed(2) + " Change: "+ (((rawValue.toFixed(2)/self.data[1][0])-1)*100).toFixed(2)+"%",

			// series style
			stroke:   "rgb(0, 255, 255)",  /*"rgb(19, 139, 234)"*/
			width: 1,
			//fill: "rgba(9, 139, 234, 0.3)",
			//dash: [10, 5],
		},
		{	//PREMARKET
			spanGaps: false,
			show: true,
			stroke:  "rgba(0, 120, 150, 1)" /*#fca"*/,
			width: 1,
			//fill: "rgba(0, 0, 0, 0.25)",
			//scale:"pre",
		
		},
		{	//AFTER MARKET
			spanGaps: false,
			show: true,
			stroke:  "rgba(100, 100, 150,1)",
			width: 1,
			//fill: "rgba(0, 0, 0, 0.5)",
			//scale:"pre",
		
		},		
		{	//COST LINE
			show: true,
			stroke:  "rgba(200, 0, 0,1)",
			width: 1,
			//fill: "rgba(0, 0, 0, 0.5)",
			//scale:"pre",
			dash: [10, 5],
		
		}
	],
	scales: {
		x: {
			distr: 2,
			
		},
		"pre": {
			range: [-1,1],
		}
					
	},
	axes: [
  {
	show:true,
	side:2,
	size:0,
	gap:-30,
	stroke:'#fff',
	font: "8px Oswald",
	grid: {
        show: true,
        stroke: "rgba(255,255,255,0.1)",
        width: 1,
        dash: [],
      },
	  space: 40,
      incrs: [
         // minute divisors (# of secs)
         1,
         5,
         10,
         15,
         30,
         // hour divisors
         60,
         60 * 5,
         60 * 10,
         60 * 15,
         60 * 30,
         // day divisors
         3600,
      // ...
      ],
      // [0]:   minimum num secs in found axis split (tick incr)
      // [1]:   default tick format
      // [2-7]: rollover tick formats
      // [8]:   mode: 0: replace [1] -> [2-7], 1: concat [1] + [2-7]
      values: [
      // tick incr          default           year                             month    day                        hour     min                sec       mode
        [3600 * 24 * 365,   "{YYYY}",         null,                            null,    null,                      null,    null,              null,        1],
        [3600 * 24 * 28,    "{MMM}",          "\n{YYYY}",                      null,    null,                      null,    null,              null,        1],
        [3600 * 24,         "{M}/{D}",        "\n{YYYY}",                      null,    null,                      null,    null,              null,        1],
        [3600,              "{h}{aa}",        "\n{M}/{D}/{YY}",                null,    "\n{M}/{D}",               null,    null,              null,        1],
        [60,                "{h}:{mm}{aa}",   "\n{M}/{D}/{YY}",                null,    "\n{M}/{D}",               null,    null,              null,        1],
        [1,                 ":{ss}",          "\n{M}/{D}/{YY} {h}:{mm}{aa}",   null,    "\n{M}/{D} {h}:{mm}{aa}",  null,    "\n{h}:{mm}{aa}",  null,        1],
        [0.001,             ":{ss}.{fff}",    "\n{M}/{D}/{YY} {h}:{mm}{aa}",   null,    "\n{M}/{D} {h}:{mm}{aa}",  null,    "\n{h}:{mm}{aa}",  null,        1],
      ],
	//splits: (s) => {return [s.origLength];}
	//labelSize:0,
	//label:"Time",
  },
  {
	show:true,
	gap:-30,
	size: 0,
	font: "8px Oswald",
	stroke:'#fff',
  }
  ],
};

let uplot = new uPlot(opts, data, target);
//hack add original datapoint length
uplot.origLength=timestamps.length;
return uplot;
}

function blurred(){
	winactive=false;
	//alert("blurred");
	speechSynthesis.cancel();
}

function active(){
	winactive=true;
	init();
}
	window.onfocus = active;
	window.onblur = blurred;
	
	
	window.addEventListener("resize", () => {
	//alert(document.documentElement.clientWidth);
	for(u of charts.values()){
		u.setSize({width:document.documentElement.clientWidth,height:180});
		
		//u.setSize(getSize());
		//setTimeout(()=> {u.setSize(getSize())},100);
		}
		pchart.setSize({width:document.documentElement.clientWidth,height:180});
	});
	
	
	//alert(window.visualViewport.width + "x"+window.visualViewport.height);
	
	
function toggleindex(){
	ele=this;
   //console.log(e.target);
	if(ele.nextSibling.style.display=="" ){
		ele.nextSibling.style.display="block"; 
		//addChart(ele.id,ele.nextSibling);
		addChartRange(ele.id,ele.nextSibling,ele.dataset.gmtoffset,ele.dataset.regMarketTime);

	}else {
		ele.nextSibling.style.display="";
		//ele.nextSibling.innerHTML="";
}

	
	}
	
	function triggerspeak(){ 
		//speechSynthesis.cancel();
		if(document.getElementById("spk").checked) {
		utt.text=" ";
			window.speechSynthesis.speak(utt); 
			resumeInfinity();
		}else{
			speechSynthesis.cancel();
		}
	}
	
	function addHolding(){
		hsymb=document.getElementById("hsymb").value;
		hprice=0;
		hnumber=0;
		isNaN(hprice=parseFloat(document.getElementById("hprice").value)) ? hprice=0 : 1;
		isNaN(hnumber=parseInt(document.getElementById("hnumber").value)) ? hnumber=0 : 1;
		
		if(hsymb!=""){
			localStorage.setItem(hsymb,'{"price":'+hprice+',"number":'+hnumber+'}');
		}
			
		
	}
	function removeHolding(){
		hsymb=document.getElementById("hsymb").value;
		localStorage.removeItem(hsymb);
		let el= document.getElementById(hsymb);
		if(el){
			el.nextSibling.remove();
			el.remove();
			if(charts.has(hsymb)) charts.delete(hsymb);
			
		}
	}
	
	
	var yfvid='<iframe width="560" height="315" src="https://www.youtube.com/embed/live_stream?channel=UCEAZeUIeJs0IjQiqTCdVSIg&playsinline=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
	
	var nbcvid='<iframe width="560" height="315" src="https://www.youtube.com/embed/live_stream?channel=UCeY0bbntWzzVIaj2z3QigXg&playsinline=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
	
	
	
	function showvid(e){

		
		if(e.textContent.includes("Show")){
			
			let d=document.createElement("div");
			d.id=e.id+"div";
			d.className="iframe-container";
			d.innerHTML=e.dataset.url;
			document.body.appendChild(d);
			e.textContent=e.textContent.replace("Show ","Hide ");


		}else {
			e.textContent=e.textContent.replace("Hide ","Show ");
			document.getElementById(e.id+"div").remove();
		}
	}
	
	var pchart;
	
	
async function getUserPortfolio(){
	
	let response=await fetch("https://tbkv.krz.workers.dev").then(r=>r.text());
	let portA=JSON.parse(response);
	portfolio=portA;
	
	
	
	
	
	let symbols=portA.map(x=>x.s);
}	
	
////PORTFOLIO CHART	
function getAllStocks(range){
	
	
	//if(document.getElementById("portfoliochart")) document.getElementById("portfoliochart").remove();
	let churl;
	var portfolioArray = [];
var timestp =[];
	//let symbols=//Object.keys(localStorage);
	if(portfolio.length==0) return null;
	
	let invested=0;
	//Valid intervals: [1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo]
	interval="1m";
	if(range>=5) interval="5m";
	if(range>=30) interval="30m";
	if(range>=60) interval="1h";
	if(range>=190) interval="1d";
	
	

	var promises = [];
	
	for( s of portfolio/*symbols*/){
		if(s.n>0){
		//churl="https://query1.finance.yahoo.com/v8/finance/chart/"+s+"?interval="+interval+"&range="+range+"d&includePrePost=false";
		//promises.push(fetch(proxies[0]+churl));
		promises.push(fetch("https://y.krz.workers.dev/y/ch/"+s.s+"?interval="+interval+"&range="+range+"d&includePrePost=false"));
		
		invested+=s.n*s.p;
		}
	}
	
	Promise.all(promises).then(function (responses) {
	// Get a JSON object from each of the responses
		return Promise.all(responses.map(function (response) {
			return response.json();
	}));
	}).then(function (data) {
	// Log the data to the console
	// You would do something with both sets of data here
		for(i=0; i<data.length; i++){
			if(timestp.length==0) timestp=data[i].chart.result[0].timestamp;
			cp=data[i].chart.result[0].indicators.quote[0].close;
			cp.cleanNull();
			symb=data[i].chart.result[0].meta.symbol;
			if(portfolioArray.length==0) portfolioArray = cp.map(x => x * getHolding(symb).n);
			else portfolioArray=portfolioArray.vectorAdd(cp.map(x => x * getHolding(symb).n));
			
		}
		cost= document.getElementById("costline").checked ? timestp.map(x=>invested) : [];
		if(pchart){
			
			pchart.setData([timestp,portfolioArray,[],[],cost]);
		}else{
			pchart=plotChart(timestp,portfolioArray,document.getElementById("portchart"),"portfoliochart",[],[],cost);
		}
	//console.log(data);
	}).catch(function (error) {
	// if there's an error, log it
	console.log(error);
	});

}