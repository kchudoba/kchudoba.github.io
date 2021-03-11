if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
  .then((reg) => {
    // registration worked
    console.log('Registration succeeded. Scope is ' + reg.scope);
  }).catch((error) => {
    // registration failed
    console.log('Registration failed with ' + error);
  });
}



var $ = document.querySelector.bind(document);
var quotes=new Map();
var default_columns=[
{"id":"symbol",				"name":"Symbol",	"type":"string"},
{"id":"price",				"name":"Price",		"type":"number"},
{"id":"change",				"name":"Change",	"type":"percent"},
{"id":"change1w",			"name":"Change 1W",	"type":"percent"},
{"id":"change1m",			"name":"Change 1M",	"type":"percent"},
{"id":"fiftyTwoWeekHigh",	"name":"52W H",		"type":"number"},
{"id":"52whp",				"name":"% to 52W H","type":"percent"},
{"id":"trailingPE",			"name":"P/E tr",	"type":"number"},
{"id":"forwardPE",			"name":"P/E fw",	"type":"number"},
{"id":"eptr",				"name":"E/P tr",	"type":"percent"},
{"id":"epfw",				"name":"E/P fw",	"type":"percent"},
{"id":"div",				"name":"Div % tr",	"type":"percent"}
]

var columns=default_columns;

var pricecharts={};
function formatVal(val,dec=2){
if(val){
return val.toFixed(dec);
}else{
return "--"
}
}

function mapQuoteToView(q){
	let vdo=q
	q=getCorrectPrice(q);
	try{
	q["52whp"]=formatVal(100*((q.fiftyTwoWeekHigh-q.price)/q.price));
	q["eptr"]=formatVal(100*q.epsTrailingTwelveMonths/q.price);
	q["epfw"]=formatVal(100*q.epsForward/q.price);
	
	q.price=formatVal(q.price);
	q.change=formatVal(q.change);
	q.trailingPE=formatVal(q.trailingPE)
	q.forwardPE=formatVal(q.forwardPE)
	q["div"]=formatVal(q.trailingAnnualDividendYield*100)
	}catch{
	
	}
	return q;

}
function getCorrectPrice(quote){
//DETERMINING WHICH PRICE TO USE
var price,change,markettime;
		if(quote.marketState=="PRE" && quote.preMarketPrice){
			price= quote.preMarketPrice;
			change=quote.preMarketChangePercent;
			markettime=quote.preMarketTime;
			//chartseries=2;
		}else if(["PREPRE","POST","POSTPOST","CLOSED"].includes(quote.marketState) &&  quote.postMarketPrice){
			price= quote.postMarketPrice;
			//change=quote.postMarketChangePercent;
			change=100*(quote.postMarketChange+quote.regularMarketChange)/quote.regularMarketPreviousClose;
			markettime=quote.postMarketTime;
			//chartseries=3;
		}
		else{
			price= quote.regularMarketPrice;
			change=quote.regularMarketChangePercent;
			markettime=quote.regularMarketTime;
			//chartseries=1;
		}
		quote["price"]=price;
		quote["change"]=change;
		return quote;
}





function handleQuotes(qR){
	if(qR.quoteResponse && qR.quoteResponse.result.length>0){
		
		let results=qR.quoteResponse.result;
		let quoteDict = new Map();
		results.forEach(q=>quoteDict.set(q.symbol,q));
		console.log(quoteDict)
		quotes=quoteDict; //setting global quotes variable
		renderQuotes(quoteDict);
		return quoteDict;
	}
	//console.log(qR.quoteResponse.result)
}

function renderQuotes(qd){
	let rows="";

	for (let q of (Array.isArray(qd) ? qd : qd.values())){
		rows+=renderQuote(q);
	}
	// $("#container").innerHTML+=rows;
	
}

function renderQuote(quote){
	let row=""
	q=mapQuoteToView(quote);

	row+=`<div class="stock" id="${q.symbol}">`;
	for (let c of columns){
		//row+=`<div>`
		row+=`<div>${q[c.id]} ${(c.type=='percent' ? '%' : '')}</div>`;
	}
	row+="</div>";
	row+=`<div class="charts"><div class="chart" id="${q.symbol}_ch"></div>
	<div class="bars"><div class="rev"></div><div class="inc"></div><div class="divi"></div></div>`;
	row+="</div>";
	row+='<div class="inforow"><div class="descr">Blalalsl dslkadjalkd alkd jalkdjald alkdjal dkjalkdj j</div></div>';

	

	if($("#"+q.symbol+"_container")==null ) {

		row=`<div class="stockcontainer" id="${q.symbol}_container">`+row+"</div>";
		$("#container").insertAdjacentHTML("beforeend",row);
	}else{
		$("#"+q.symbol+"_container").innerHTML=row;
	}
	// return row;
	//$("#container").insertAdjacentHTML("beforeend",row);
	getYChart(q.symbol)
	getMTCharts(q.symbol)
}

function renderCharts(chartdata){
	// let row=""
	
	// row+=`<div class="chart" id="${chartdata.symbol}_ch">`;
	// row+="</div>";
	// $("#"+chartdata.symbol).insertAdjacentHTML("afterend",row);
	pricecharts[chartdata.symbol]=plotChart(chartdata.timestamp,chartdata.adjclose,$("#"+chartdata.symbol+"_ch"),chartdata.symbol+"ch")
	if(Object.keys(chartdata.dividends).length>0) {
		plotSmall(Object.values(chartdata.dividends).map(x=>x.date),Object.values(chartdata.dividends).map(x=>x.amount),$("#"+chartdata.symbol+"_container .divi"),chartdata.symbol+"div","rgb(255, 0, 0)")
	}

}

function getQuote(symbols){
if(Array.isArray(symbols)){
symbols=symbols.toString();
}
var url="https://query1.finance.yahoo.com/v7/finance/quote?symbols="+symbols
fetch(url).then(x=>x.status==200? x.json(): Promise.reject("Quote query not successful")).then(handleQuotes).catch(err => { console.log(err) });
}

function handleChart(chR){
	if(chR.chart && chR.chart.result.length>0){
		
		let result=chR.chart.result[0];
		renderCharts({
		"symbol":result.meta.symbol,
		"timestamp":result.timestamp,
		"adjclose":result.indicators.adjclose[0].adjclose,
		"dividends":result.events ? result.events.dividends : {}
		});
		
	}
	//console.log(qR.quoteResponse.result)
}

function handleMTCharts(chR,symbol){
	if(chR && chR.revenue.length>0){
		let dates=chR.revenue.map(x=>Math.floor(Date.parse(x.date)/1000));
		let qrevs=chR.revenue.map(x=>x.v2);
		plotSmall(dates,qrevs,$("#"+symbol+"_container .rev"),symbol+"rev","rgb(0, 255, 0)")
	}
	if(chR && chR.income.length>0){
		let dates=chR.income.map(x=>Math.floor(Date.parse(x.date)/1000));
		let qincs=chR.income.map(x=>x.v2);
		plotSmall(dates,qincs,$("#"+symbol+"_container .inc"),symbol+"inc","rgb(255, 255, 0)")
	}
	if(chR && chR.description){
		$("#"+symbol+"_container .descr").innerHTML=chR.description;
	}

	//console.log(qR.quoteResponse.result)
}

function getYChart(symbol){

	var url="https://query1.finance.yahoo.com/v8/finance/chart/"+symbol+"?interval=1d&range=5y&includePrePost=false&events=div&useYfid=true"
	
	fetch(url).then(x=>x.status==200? x.json(): Promise.reject("Chart query not successful")).then(handleChart).catch(err => { console.log(err) });

}

function getMTCharts(symbol){

	var url="https://mt.krz.workers.dev/"+symbol;
	
	fetch(url).then(x=>x.status==200? x.json(): Promise.reject("Chart query not successful")).then(res=>handleMTCharts(res,symbol)).catch(err => { console.log(err) });

}



var n_header=$(".header");
for(let c of default_columns){
	let html=`<div>${c.name}</div>`
	n_header.innerHTML+=html;
}






function getSize(type=0) {
	//alert(window.visualViewport.width);
	if(type==0) return {
		width: (document.documentElement.clientWidth-20)*2/3,
		height: 300,
	};
	if(type==1) return {
		width: (document.documentElement.clientWidth-20)*1/3,
		height: 100,
	};

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
						//touchZoomPlugin()
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
			value: (self, rawValue) => "$" + rawValue.toFixed(2) + " Change: "+ (((rawValue.toFixed(2)/self.data[1][self.valToIdx(self.scales.x.min)])-1)*100).toFixed(2)+"%",
			drawStyle:1,
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
			//distr: 2,
			auto: true,

			//range: (min, max) => [Math.floor(Date.now()/1000 - 24*60*60 *365.25 * 5),Math.floor(Date.now()/1000)]
			min:Math.floor(Date.now()/1000 - 24*60*60 *365.25 * 5),
			max:Math.floor(Date.now()/1000)
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
      /*incrs: [
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
	//label:"Time",*/
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


function plotSmall(timestamps, priceseries, target,chartid,color="rgb(0, 255, 255)"){
	
	let data = [
	  timestamps,    // x-values (timestamps)
	  priceseries,    // y-values (series 1)
	];
	
	let opts = {
  id: chartid,
  tzDate: ts => uPlot.tzDate(new Date(ts * 1e3), "America/New_York"),
  class: "my-chart",
  ...getSize(1),
	plugins: [
						//touchZoomPlugin()
	],
	series: [
		{
			spanGaps: false,
		},
		{
			show: true,
			//spanGaps: false,
			// in-legend display
			label: "Amount",
			value: (self, rawValue) => "$" + rawValue.toFixed(2) + " Change: "+ (((rawValue.toFixed(2)/self.data[1][0])-1)*100).toFixed(2)+"%",
			drawStyle:1,
			// series style
			stroke:   color,  /*"rgb(19, 139, 234)"*/
			width: 1,
			//fill: "rgba(9, 139, 234, 0.3)",
			//dash: [10, 5],
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
	space: 40,
    
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