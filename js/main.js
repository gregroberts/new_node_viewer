
//Global functions


//at the start, hide things we don't need
$('#Info_Panel').hide();
$('#graph-config').hide();
$('#loading').append('<img src="js/fancybox/fancybox_loading@2x.gif" >');

//controls loading gif
function s_load() {
    $('#loading').show();
};
function e_load() {
    $('#loading').hide();
};

//we need to make sure the proper 'originalColor values are stored for each node
//this function just adds that as an att of each node
function normal_cols(s){
    try{
        s.graph.nodes().forEach(function(n){
            n.color = n.originalColor;
        });
        s.graph.edges().forEach(function(n){
            n.color = n.originalColor;
        });
    }
    catch (err){
        console.log(err);
    }
};


//method for finding neighbors
sigma.classes.graph.addMethod('neighbors', function(nodeId){
    var k,
        neighbors = {},
        index = this.allNeighborsIndex[nodeId] || {};
    for (k in index)
      neighbors[k] = this.nodesIndex[k];
    return neighbors;        
});


//takes output of the php script, adds new nodes
function add_objects(s,result, node) {
    //relative position of parent node
    var _x = node.data.node.x,
        _y = node.data.node.y;   
    //get preexisting nodes and edges
    var nodels = Array(),
        edgels = Array();             
    s.graph.nodes().forEach(function(node){nodels.push(node['label'])});
    s.graph.edges().forEach(function(edge){edgels.push(edge['id'])});
    //add new nodes
    try{
        res = jQuery.parseJSON(result);
    }
    catch(err){
        console.log('GURRR')
    };

    ns = res['nodes'].length;
    if (ns == 0){
        e_load();        
        alert('No Nodes Found!');
        //$('#sigma-container').empty();

    }
    for (var i =0; i<ns; i++){
        n = res['nodes'][i];
        if (nodels.indexOf(n['label'])==-1){
            try {
                s.graph.addNode({
                    id:n['id'],
                    label:n['label'].replace(/\+/g," "),
                    x:_x + Math.sin(2*Math.PI/(i+1)),
                    y:_y + Math.cos(2*Math.PI/(i+1)),
                    size:n['size'],
                    color: n['colour'],
                    reCursed:0
                });
            }
            catch(err){console.log(err)}
        };
    };
    for (var i=0; i<res['edges'].length; i++){
        n = res['edges'][i];
        theid = n['id'];
        if (edgels.indexOf(theid) == -1){
            try {
                s.graph.addEdge({
                    id: theid,
                    source: n['source'].replace(/\+/g," "),
                    target: n['target']
                });
            }
            catch(err){console.log(err);}
        };
    };
    //update s.graph with required properties for binding functions
    s.graph.nodes().forEach(function(n){
        n.originalColor = n.color;
    });
    s.graph.edges().forEach(function(e){
        e.originalColor = e.color;
    });
};

//for when a new node is double clicked
function add_node(site,e,rel,s) {
    s_load();
    //reset all colours first
    normal_cols(s)
    var nodelabel=  e.data.node.label;
    $.ajax({
        url:'getnode.php',
        type:'GET',
        async:true,
        data: {
            'node':nodelabel.replace(/ /g,"_"),
            'rel':rel,
            'site':site},
        success: function (result) {
            add_objects(s, result, e);
            e_load();
            s.startForceAtlas2();
        },
        error: function(result) {console.log(result);}
    })    
};    


//most of the graph related functions are only triggered once the graph is instanciated
$('#node0submit').click(function (){
    var node0 = $('#node0').val();
    $('#sigma-container').empty();
    //initialize sigma with settings
    var s = new sigma({
        container: 'sigma-container',
        settings: {
            edgeColor: '#000',
            minNodeSize: 10,
            maxNodeSize: 25,
            animationsTime: 800,
            doubleClickEnabled:false,
            doubleClickTimeout: 900,
            labelSize:"proportional"
        }
    });
    var site = 'google';
    var rel = $('#rel').val();
    zeroth = {
        id:'n'+node0,
        label:node0,
        x:0,
        y:0,
        size:1,
        color:'#f00'
    };
    //add node zero && neighborhood
    s.graph.addNode(zeroth);
    var a = new Object();
    var b = {node:zeroth};
    a.data = b;
    add_node(site,a,rel,s);

    $('#recursion').show();

    //recursion, hee hee hee.
    $('#recursion').on("click", function(){
        $('#loading').empty();
        var depth = prompt("enter recursion depth", "4");
        for (i=0 ; i<depth; i++){
            s.graph.nodes().forEach(function(n){
                if (n.reCursed == 0){
                    m = new Object();
                    o = {node:n};
                    m.data = o;
                    add_node(site, m, rel, s);
                    n.reCursed = 1;
                }
            });
        };
        $('#loading').append('<img src="js/fancybox/fancybox_loading@2x.gif" >');
    })

    //graph config options
    $('#graph-config').show("fast");
    //node sizer
    $('#node-size-slider').slider({
        range:true,
        min:1,
        max:50,
        values: [10, 25],
        slide: function(event, ui) {
            s.settings({
                minNodeSize: ui.values[0],
                maxNodeSize: ui.values[1],
            });
            s.refresh();
        }       
    });
    //layout options
    $('#stop').click(function(){s.stopForceAtlas2()});
    $('#start').click(function(){s.startForceAtlas2()});

    //search functionality
    $('#nodes-search').on("click", function(){
        var res =  $('#search-results');
        res.empty();
        var results = Array();
        term = $('#search-input').val().toLowerCase();
        if (term.length < 3){
            res.append('<i>Search term must be more than two characters</i>');
        }
        else{
            //find matches
            s.graph.nodes().forEach(function(n){
                var lab = n.label.toLowerCase();
                if (lab.indexOf(term) != -1){
                    results.push(Array(n.label, n.id));
                }
            });
            //ashow matches
            if (results.length > 0){
                res.append('<b>Search Results:</b><br>');
            }
            else{ res.append('<b>No results :( </b><br>')}
            results.forEach(function(result){
                res.append("<a class='gonode' href='#' node='"+result[1]+"'>"+result[0]+"</a><br>");
            });
            //bind onclick action for search results
            $('.gonode').click(function(){
                var _x = 0.0,
                    _y = 0.0,
                toFind = $(this).attr('node');
                //find where this node is right now
                s.graph.nodes().forEach(function(n){
                    if (n.id == toFind){
                        _x = n['read_cam0:x'];
                        _y = n['read_cam0:y'];
                    };
                });
                //hop to it!
                s.cameras[0].goTo({
                    x:_x,
                    y:_y,
                    ratio:0.5
                });
            });  
        };
    });


    

    //let's bind some methods to the graph
    //clicking a node fetches the children of that node
    var k = -5;
    var startNode = new Date();
    s.bind('clickNode', function(e){
        var diff = new Date() - startNode;
        //double click extends the network
        if (k== e.data.node.id && diff<=500){
            add_node(site, e, rel, s);
        }
        //single click brings up the info panel
        else {
            k=e.data.node.id;
            startNode = new Date();
            console.log(e.data.node.label);
            $('#infopanel').empty();
            $('#infopanel').append(e.data.node.label);
            $('#Info_Panel').show("slow");
        }
    })

    //hovering over a node dims everything but it's immediate neighbors
    s.bind('overNode', function(e){
        var nodeId = e.data.node.id,
            toKeep = s.graph.neighbors(nodeId);
        toKeep[nodeId] = e.data.node;
        s.graph.nodes().forEach(function(n) {
            if (toKeep[n.id])
                n.color = n.originalColor;
            else
                n.color = '#eee';
        });
        s.graph.edges().forEach(function(e) {
            if (toKeep[e.source] && toKeep[e.target])
                e.color = e.originalColor;
            else
                e.color = '#eee';
        });
        s.refresh();
    });
    //opposite of overnode
    s.bind('outNodes', function(e){
        normal_cols(s);
    });

    //clicking the stage gets rid of the info panel
    s.bind('clickStage', function(e){
        $('#Info_Panel').hide("slow");
        normal_cols(s);
    });
});
