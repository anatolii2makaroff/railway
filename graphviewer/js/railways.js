/*
- loading elements via http request
- loading style via http request
- using the preset layout with predefined positions in each element
- using motion blur for smoother viewport experience
- using `min-zoomed-font-size` to show labels only when needed for better performance
*/

/* global document, fetch, window, cy, cytoscape, Promise, tippy */

document.addEventListener('DOMContentLoaded', function(){

  var $ = function(sel){ return document.querySelector(sel); };

  // hyperscript-like function
  var h = function(tag, attrs, children){
    var el = document.createElement(tag);

    if(attrs != null && typeof attrs === typeof {}){
      Object.keys(attrs).forEach(function(key){
        var val = attrs[key];

        el.setAttribute(key, val);
      });
    } else if(typeof attrs === typeof []){
      children = attrs;
    }

    if(children != null && typeof children === typeof []){
      children.forEach(function(child){
        el.appendChild(child);
      });
    } else if(children != null && typeof children === typeof ''){
      el.appendChild(document.createTextNode(children));
    }

    return el;
  };

  var toJson = function(obj){ return obj.json(); };
  var toText = function(obj){ return obj.text(); };

  // get exported json from cytoscape desktop
  var graphP = fetch('./data/railways.json').then(toJson);

  // also get style
  var styleP = fetch('./css/railways.cycss').then(toText);

  // when both graph export json and style loaded, init cy
  Promise.all([ graphP, styleP ]).then(initCy);

  function initCy( then ){
    var loading = document.getElementById('loading');
    var expJson = then[0];
    var styleJson = then[1];
    var elements = expJson.elements;

    loading.classList.add('loaded');

    window.cy = cytoscape({
      container: document.getElementById('cy'),
      layout: { name: 'preset' },
      style: styleJson,
      elements: elements,
      motionBlur: true,
      selectionType: 'single',
      boxSelectionEnabled: false
      //autolock: true,
      //autoungrabify: true
      });

    //mendData();
    bindRouters();
  }

  function mendData(){
    // because the source data doesn't connect nodes properly, use the cytoscape api to mend it:

    cy.startBatch();

    // put nodes in bins based on name
    var nodes = cy.nodes();
    var bin = {};
    var metanames = [];
    for( var i = 0; i < nodes.length; i++ ){
      var node = nodes[i];
      var name = node.data('station_name');
      var nbin = bin[ name ] = bin[ name ] || [];

      nbin.push( node );

      if( nbin.length === 2 ){
        metanames.push( name );
      }
    }

    // connect all nodes together with walking edges
    for( var i = 0; i < metanames.length; i++ ){
      var name = metanames[i];
      var nbin = bin[ name ];

      for( var j = 0; j < nbin.length; j++ ){
        for( var k = j + 1; k < nbin.length; k++ ){
          var nj = nbin[j];
          var nk = nbin[k];

          cy.add({
            group: 'edges',
            data: {
              source: nj.id(),
              target: nk.id(),
              is_walking: true
            }
          });

          //.css({
        //    'line-color': 'yellow'
          // });
        }
      }

    }

    cy.endBatch(); //.autolock( true );
  }

  var start, end;
  var $body = document.body;

  function selectStart( node ){
    clear();

    $body.classList.add('has-start');

    start = node;

    start.addClass('start');
  }

  function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
      return response
    } else {
      var error = new Error(response.statusText)
      error.response = response
      throw error
    }
  }

  function parseJSON(response) {
    return response.json()
  }

  function selectEnd( node ){
    $body.classList.add('has-end', 'calc');

    end = node;

    cy.startBatch();

    //end.addClass('end');

    //setTimeout(function(){
      
      // get route from server 

      console.log(start.data());
      console.log(end.data());
      

      var aStar = {"found": true, 
                   "path":[], 
                   "distance": 0}


      fetch('/api/v1/pathq', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({"op":"get_shortest", 
                              "data":{"source": start.data()["id"], "target": end.data()["id"]}
        })  
      }).then(checkStatus)
        .then(parseJSON)
        .then(function(data) {
          aStar.path = data.path;
          // console.log('request succeeded with JSON response', data)


            if( !aStar.found ){
                $body.classList.remove('calc');
                clear();

                cy.endBatch();
                return;
            }

            // mark route

            cy.elements().addClass('not-path')

            lenAStar = aStar.path.length;

            n = 0;

            for(i in aStar.path){

                // console.log(aStar.path[i]);

                cy.nodes("#" + aStar.path[i]).removeClass('not-path')

                if (n == 0){
                cy.nodes("#" + aStar.path[i]).addClass('start');        
                } else if(n == lenAStar - 1){
                cy.nodes("#" + aStar.path[i]).addClass('end');
                }
                        
                if (n > 0 && n != lenAStar){

                cy.edges("edge[source = '" + lastNode + "'][target= '" + aStar.path[i] + "']").removeClass('not-path')        
                cy.edges("edge[source = '" + aStar.path[i] + "'][target= '" + lastNode + "']").removeClass('not-path')        
 
                }

                lastNode = aStar.path[i];
                n++;
                
            }

            cy.endBatch();

            $body.classList.remove('calc');


            }).catch(function(error) {
            console.log('request failed', error)
        });

    //}, 300);
  }

  function clear(){
    $body.classList.remove('has-start', 'has-end');
    cy.elements().removeClass('path not-path start end');
  }

  var shownTippy;

  function makeTippy(node, html){
    removeTippy();

    shownTippy = tippy( node.popperRef(), {
      html: html,
      trigger: 'manual',
      arrow: true,
      placement: 'bottom',
      hideOnClick: false,
      duration: [250, 0],
      theme: 'light',
      interactive: true,
      onHidden: function(tip){
        if(tip != null){
          tip.destroy();
        }
      }
    } ).tooltips[0];

    shownTippy.show();

    return shownTippy;
  }

  function removeTippy(){
    if(shownTippy){
      shownTippy.hide();
    }
  }

  function bindRouters(){

    var $clear = $('#clear');

    cy.on('tap pan zoom', function(e){
      if(e.target === cy){
        removeTippy();
      }
    });

    cy.on('tap', 'node', function(e){
      var node = e.target;

      var start = h('button', { id: 'start' }, 'START');

      start.addEventListener('click', function(){
        var n = cy.$('node:selected');

        selectStart( n );

        removeTippy();
      });

      var end = h('button', { id: 'end', }, 'END');

      end.addEventListener('click', function(){
        var n = cy.$('node:selected');

        selectEnd( n );

        removeTippy();
      });

      var html = h('div', { className: 'select-buttons' }, [ start, end]);

      makeTippy(node, html);
    });

    /*
    cy.nodes().qtip({
      content: {
        text: function(){
          var $ctr = $('<div class="select-buttons"></div>');
          var $start = $('<button id="start">START</button>');
          var $end = $('<button id="end">END</button>');

          $start.on('click', function(){
            var n = cy.$('node:selected');

            selectStart( n );

            n.qtip('api').hide();
          });

          $end.on('click', function(){
            var n = cy.$('node:selected');

            selectEnd( n );

            n.qtip('api').hide();
          });

          $ctr.append( $start ).append( $end );

          return $ctr;
        }
      },
      show: {
        solo: true
      },
      position: {
        my: 'top center',
        at: 'bottom center',
        adjust: {
          method: 'flip'
        }
      },
      style: {
        classes: 'qtip-bootstrap',
        tip: {
          width: 16,
          height: 8
        }
      }
    });
    */

    $clear.addEventListener('click', clear);
  }
});
