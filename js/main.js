//method for finding neighbors
sigma.classes.graph.addMethod('neighbors', function(nodeId){
    var k,
        neighbors = {},
        index = this.allNeighborsIndex[nodeId] || {};
    for (k in index)
      neighbors[k] = this.nodesIndex[k];
    return neighbors;        
});

//we need to make sure the proper 'originalColor values are stored for each node'
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
    res = jQuery.parseJSON(result);
    ns = res['nodes'].length;
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
                    color: n['colour']
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

function add_node(site,e,rel,s) {
    //reset all colours first
    normal_cols(s)
    var nodelabel=  e.data.node.label;
    $.ajax({
        url:'getnode.php',
        type:'GET',
        data: {
            'node':nodelabel.replace(/ /g,"_"),
            'rel':rel,
            'site':site},
        success: function (result) {
            add_objects(s, result, e);
            s.startForceAtlas2();
            console.log(s.graph.nodes());
        },
        error: function(result) {console.log(result);}
    })    
};    

$('#node0submit').click(function (){
    var node0 = $('#node0').val();
    $('#container').empty();
    //initialize sigma with settings
    var s = new sigma({
        container: 'container',
        settings: {
            edgeColor: '#000',
            minNodeSize: 3,
            maxNodeSize: 10,
            animationsTime: 400
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
    s.refresh();
    console.log(s.graph.nodes());    
    var a = new Object();
    var b = {node:zeroth};
    a.data = b;
    add_node(site,a,rel,s);

    //let's bind some methods to the graph
    //clicking a node fetches the children of that node
    s.bind('clickNode', function(e){
        add_node(site, e, rel, s);
    });

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






    $('#stop').click(function(){s.stopForceAtlas2()});
    $('#start').click(function(){s.startForceAtlas2()});
});
