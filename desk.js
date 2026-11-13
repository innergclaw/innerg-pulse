/* INNERG PULSE: live watchlist preview. Reads the same public data as the Market Desk. */
(function(){
  var DATA='https://innergclaw.github.io/innerg-watchlist/data/watchlist.json',DESK='https://nasirr.innergintel.study/watchlist/';
  var grid=document.getElementById('desk-grid'),time=document.getElementById('desk-time'),tabs=[].slice.call(document.querySelectorAll('.dtab'));
  if(!grid)return;
  var data=null,view='all',SHOW=8;
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function money(v,cur){if(!isFinite(v))return '&mdash;';var a=Math.abs(v)<1;try{return new Intl.NumberFormat('en-US',{style:'currency',currency:cur||'USD',minimumFractionDigits:a?4:2,maximumFractionDigits:a?4:2}).format(v)}catch(e){return '$'+Number(v).toFixed(2)}}
  function pct(v){return isFinite(v)?(v>0?'+':'')+v.toFixed(2)+'%':'&mdash;'}
  function pick(){
    var list=(data.assets||[]).filter(function(a){var d=a.returns&&a.returns.day;return isFinite(d)&&(view==='all'||(view==='crypto'?a.assetType==='Crypto':a.assetType!=='Crypto'))});
    list.sort(function(a,b){return Math.abs(b.returns.day)-Math.abs(a.returns.day)});
    return list.slice(0,SHOW);
  }
  function render(){
    var rows=pick();
    if(!rows.length){grid.innerHTML='<li class="desk-empty">No moves to show here yet. <a href="'+DESK+'">Open the full market desk</a>.</li>';return}
    grid.innerHTML=rows.map(function(a,i){var d=a.returns.day,w=a.returns&&a.returns.week,up=d>=0,tilt=((i*37%7)-3)*0.35;
      return '<li class="tick" style="--i:'+i+';--tilt:'+tilt.toFixed(2)+'deg"><div class="tick-top"><h3 class="tick-sym">'+esc(a.symbol)+'</h3>'+
        '<span class="tick-chg '+(up?'up':'down')+'"><span aria-hidden="true">'+(up?'&#9650;':'&#9660;')+'</span> '+pct(d)+'<span class="sr-only">'+(up?' up':' down')+' today</span></span></div>'+
        '<p class="tick-name">'+esc(a.name)+'</p><p class="tick-price">'+money(a.price,a.currency)+'</p>'+
        (isFinite(w)?'<p class="tick-wk">1 week '+pct(w)+'</p>':'')+'</li>'}).join('');
  }
  function stamp(){
    var t=new Date(data.generatedAt);if(isNaN(t))return;
    var s=t.toLocaleString('en-US',{weekday:'short',hour:'numeric',minute:'2-digit',timeZone:'America/New_York'});
    time.classList.remove('err');time.textContent='Updated '+s+' ET';
  }
  function load(){
    fetch(DATA+'?v='+Date.now(),{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).then(function(d){
      if(!d||!Array.isArray(d.assets))throw new Error('bad data');data=d;render();stamp();
    }).catch(function(){
      if(data)return;
      time.classList.add('err');time.textContent='The desk is catching its breath';
      grid.innerHTML='<li class="desk-empty">Live numbers did not load. <a href="'+DESK+'">Open the full market desk</a>.</li>';
    });
  }
  tabs.forEach(function(b){b.addEventListener('click',function(){view=b.dataset.view;tabs.forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});if(data)render()})});
  load();
  setInterval(function(){if(!document.hidden)load()},10*60*1000);
})();
