// おそらくノード上の処理は全てrestartが請け負ってる
//　わからなかった部分の憶測として.on()で加えられた要素は一度加えられたらそのままhtml上で処理される？ javascript ではなのでrestart（）で
// 上のとうりhtml にはeventrigger/handdler機能がある


// 

// neo4j setting and generate nodes and links datasets
//var neo4j = require('neo4j-driver');


var driver = new neo4j.v1.driver(
  "bolt://neo4j:test@localhost:7687",
  neo4j.v1.auth.basic('', '')
);


// set up initial  and links
//  - nodes are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - links are always source < target; edge directions are set by 'left' and 'right'.
// maybe should initialize nodes through node.js and js driver   

// ノードはidとreflexive の設定　lsastId の更新　links


//const nodes = [
//  { id: 0, reflexive: false },
//  { id: 1, reflexive: true },
//  { id: 2, reflexive: false }
//];
//let lastNodeId = 2;
//const links = [
//  { source: nodes[0], target: nodes[1], left: false, right: true },
//  { source: nodes[1], target: nodes[2], left: false, right: true }
//];
const nodes = [];
let lastNodeId = 0;
const links = [];
var session = driver.session()
session
  .run('MATCH (n:Categories), l = (n:Categories)-[rel]->() RETURN n, l ')
  .then( result=> {
    result.records.forEach( record => {
      console.log(record.get('n'));
      var node = {
        // id: uuid() uuid not in JSes6
        id : lastNodeId++,  // possible to proceed push id num into dic then proceed addtion process by set ++ after variable
        name: record.get('n').properties.category_name,
        reflexive: ''
        
      };

      if (record.get('n').properties.reflexive == 'false'){
        node.reflexive = false;
      }else{
        node.reflexive = true;
      }
      nodes.push(node);
      var link = {
        start:record.get('l').start.properties.category_name,
        end:record.get('l').end.properties.category_name
      }
      console.log(nodes,link);
    });
    session.close();
    driver.close();
    restart();
  })
  .catch( error => {
    console.log(error);
  });

// confirm inside of nodes
const wait = (sec) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, sec*1000);
    //setTimeout(() => {reject(new Error("エラー！"))}, sec*1000);
  });
};

async function main() {
  try {
    await wait(10); // ここで10秒間止まります
    console.log(nodes)
    // ここに目的の処理を書きます。

  } catch (err) {
    console.error(err);
  }
}

main();





// set up SVG for D3
// use D3 v5
//cosider to user d3-force for simulating physical directed force 

// svg ないでクリックで新しいノード作成部分を見つける

// ノードを複数消す時にforぶんが最初のselectedNodeの０indexから数えて偶数が削除できない
// .attr を使った処理でuncaugth error .attr がd3.js の中の.setAttarがfunctionではないとエラーが出る。

// django　とのデータ連携。: js の関数化と引数の入レルところ

const width = window.outerWidth;
const height = window.outerHeight;
const colors = d3.scaleOrdinal(d3.schemeCategory10);

const svg = d3.select('body')
  .append('svg')
  .on('contextmenu', () => {
    d3.event.preventDefault();
    var cxt = fucntion cxt(){
      var cy = this; // return whole html tags
      return cy
    };

  })  // definition contextmenu = right click event
  .attr('width', width)
  .attr('height', height);


// init D3 force layout
const force = d3.forceSimulation()
  .force('link', d3.forceLink().id((d) => d.id).distance(150)) 
  .force('charge', d3.forceManyBody().strength(-500))
  .force('x', d3.forceX(width / 2))
  .force('y', d3.forceY(height / 2))
  .on('tick', tick);  //tick はupdate用途？

// init D3 drag support
const drag = d3.drag()
  // Mac Firefox doesn't distinguish between left/right click when Ctrl is held... 
  .filter(() => d3.event.button === 0 || d3.event.button === 2)
  .on('start', (d) => {
    if (!d3.event.active) force.alphaTarget(0.3).restart();

    d.fx = d.x;
    d.fy = d.y;
  })
  .on('drag', (d) => {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  })
  .on('end', (d) => {
    if (!d3.event.active) force.alphaTarget(0);

    d.fx = null;
    d.fy = null;
  });

// define arrow markers for graph links
// <svg><defs>get this</dfs></svg> svg:defs
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#000');

// line displayed when dragging new nodes
const dragLine = svg.append('svg:path')
  .attr('class', 'link dragline hidden')
  .attr('d', 'M0,0L0,0');

// handles to link and node element groups
// ここでの<g>群は別々のまとまり
let path = svg.append('svg:g').selectAll('path');  // path : class for describing links
let circle = svg.append('svg:g').selectAll('g'); // node in <g></g>

// mouse event vars
// let selectedNode = null;
// let selectedNode = null;
let selectedNode = [];
let selectedLink = null;
let mousedownLink = null;
let mousedownNode = null;
let mouseupNode = null;

function resetMouseVars() {
  mousedownNode = null;
  mouseupNode = null;
  mousedownLink = null;
}

// update force layout (called automatically each iteration)
function tick() {
  // draw directed edges with proper padding from node centers
  path.attr('d', (d) => {
    // const　で宣言して変数を作る
    const deltaX = d.target.x - d.source.x;
    const deltaY = d.target.y - d.source.y;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const normX = deltaX / dist;
    const normY = deltaY / dist;
    const sourcePadding = d.left ? 17 : 12;
    const targetPadding = d.right ? 17 : 12;
    const sourceX = d.source.x + (sourcePadding * normX);
    const sourceY = d.source.y + (sourcePadding * normY);
    const targetX = d.target.x - (targetPadding * normX);
    const targetY = d.target.y - (targetPadding * normY);

    // return で.attr で入れる実数を返す
    return `M${sourceX},${sourceY}L${targetX},${targetY}`;
  });

  circle.attr('transform', (d) => `translate(${d.x},${d.y})`);
}

function cxtmenu(){

}

// update graph (called when needed)
function restart() {
  // path (link) group
  path = path.data(links);

  // update existing links
  path.classed('selected', (d) => d === selectedLink)
    .style('marker-start', (d) => d.left ? 'url(#start-arrow)' : '')
    .style('marker-end', (d) => d.right ? 'url(#end-arrow)' : '');

  // remove old links
  path.exit().remove();

  // add new links
  path = path.enter().append('svg:path')
    .attr('class', 'link')
    .classed('selected', (d) => d === selectedLink)
    .style('marker-start', (d) => d.left ? 'url(#start-arrow)' : '')
    .style('marker-end', (d) => d.right ? 'url(#end-arrow)' : '')
    .on('mousedown', (d) => {
      if (d3.event.ctrlKey) return;

      // select link
      mousedownLink = d;
      selectedLink = (mousedownLink === selectedLink) ? null : mousedownLink;
      selectedNode.splice(selectedNode.indexOf(d),1);
      restart();
    })
    .merge(path);

  // circle (node) group
  // NB: the function arg is crucial here! nodes are known by id, not by index!
  circle = circle.data(nodes, (d) => d.id);

  // update existing nodes (reflexive & selected visual states)
  circle.selectAll('circle')
    .style('fill', (d) => (selectedNode.indexOf(d) >= 0) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id))
    .classed('reflexive', (d) => d.reflexive);

  // remove old nodes
  circle.exit().remove();

  // add new nodes
  const g = circle.enter().append('svg:g');

  g.append('svg:circle')
    .attr('class', 'node')
    .attr('r', 12)
    .style('fill', (d) => (selectedNode.indexOf(d) >= 0) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id))
    .style('stroke', (d) => d3.rgb(colors(d.id)).darker().toString())
    .classed('reflexive', (d) => d.reflexive)
    .on('mouseover', function (d) {
      // if (!mousedownNode || d === mousedownNode) return; // ここがおかしいので反応しない
      // if (d === selectedNode) return;
      if (selectedNode.indexOf(d) >= 0 ) return;
      // enlarge target node
      d3.select(this).attr('transform', 'scale(1.3)');
    })
    .on('mouseout', function (d) {
      // if (!mousedownNode || d === mousedownNode) return;　// ここがおかしいので反応しない　!down || down てことは全部のノード　作者はどのような状況の時preventしたかったか？
      // おそらくクリックしてるのに　だと思うけど必要ない気がする　つまりクリックした時はpreventさせるべき？
      // てことでdown時prevent
      // if (d === selectedNode) return;
      if (selectedNode.indexOf(d) >= 0 ) return;
      // 
      // unenlarge target node
      d3.select(this).attr('transform', '');
    })
    .on('mousedown', (d) => {
      if (d3.event.ctrlKey) return;

      // select node
      mousedownNode = d;
      //selectedNode = (mousedownNode ===　selectedNode) ? null : mousedownNode; // if down === selected: selected = null else down
      // 課題：ドラッグ中はtransform とselected させないようにする
      if (selectedNode.indexOf(mousedownNode) >= 0 ){
        unselecte = selectedNode.indexOf(mousedownNode);
        selectedNode.splice(unselecte,1)
      }else{
        selectedNode.unshift(mousedownNode);
      }
      selectedLink = null;

      // if (selectedNode.indexOf(mousedownNode) >= 0){}

      // reposition drag line ここでドラック線を動的に生成している
      dragLine
        .style('marker-end', 'url(#end-arrow)')
        .classed('hidden', false)
        .attr('d', `M${mousedownNode.x},${mousedownNode.y}L${mousedownNode.x},${mousedownNode.y}`);

      // if (d === selectedNode) {
      var needle =  d3.select(this);
      if (selectedNode.indexOf(d) >= 0 ){
        d3.select(this).attr('transform', ''); // .attr を使うとuncaught error functionと間違えられてerrorが出る
        // その関係でdragline の更新が行われず動的に表現できなかった。
        //needle.attr('transform', '');
      }else{
        //d3.select(this).attr('transform', '1.5');
        needle.attr('transform', '1.3');
      }; // このやり方だと複数個選択することができないので　辞書を作るべき
      restart();
    })
    .on('mouseup', function (d) {
      if (!mousedownNode) return;


      // needed by FF　多分ここでドラッグせん確定？
      dragLine
        .classed('hidden', true)
        .style('marker-end', '');

      // check for drag-to-self
      mouseupNode = d;
      if (mouseupNode === mousedownNode) {
        resetMouseVars();
        return;
      }

      // unenlarge target node
      d3.select(this).attr('transform', '');

      // add link to graph (update if exists)
      // NB: links are strictly source < target; arrows separately specified by booleans
      const isRight = mousedownNode.id < mouseupNode.id;
      const source = isRight ? mousedownNode : mouseupNode;
      const target = isRight ? mouseupNode : mousedownNode;

      const link = links.filter((l) => l.source === source && l.target === target)[0];
      if (link) {
        link[isRight ? 'right' : 'left'] = true;
      } else {
        links.push({ source, target, left: !isRight, right: isRight });
      }

      // select new link
      selectedLink = link;
      selectedNode.splice(selectedNode.indexOf(d),1);
      restart();
    });

  // show node name
  g.append('svg:text')
    .attr('x', 0)
    .attr('y', 4)
    .attr('class', 'id')
    .text((d) => d.name);// nodeのなまえ, node:featre:name

  circle = g.merge(circle);

  // set the graph in motion
  force
    .nodes(nodes)
    //.force('center', d3.forceCenter(width / 2, height / 2))
    .force('link').links(links);

  force.alphaTarget(0.3).restart();
}


// fix: need to conbine cxtmenu and create node with connecting neo4j
function mousedown() {　
  // because :active only works in WebKit?
  svg.classed('active', true);

  if (d3.event.ctrlKey || mousedownNode || mousedownLink) return;  
  // 式がないreturnはwhileでいうbreak みたいな
  // そのまま下の式を実行しないで終了する。

  // insert new node at point
  const point = d3.mouse(this);
  const node = { id: ++lastNodeId, reflexive: false, x: point[0], y: point[1] }; 
  nodes.push(node);
  // push() メソッドは、配列の末尾に 1 つ以上の要素を追加することができます。また戻り値として新しい配列の要素数を返します。

  restart();
}

function mousemove() {
  if (!mousedownNode) return;

  // update drag line
  dragLine.attr('d', `M${mousedownNode.x},${mousedownNode.y}L${d3.mouse(this)[0]},${d3.mouse(this)[1]}`);
}

function mouseup() {
  if (mousedownNode) {
    // hide drag line
    dragLine
      .classed('hidden', true)
      .style('marker-end', '');
  }

  // because :active only works in WebKit?
  svg.classed('active', false);

  // clear mouse event vars
  resetMouseVars();
}

function spliceLinksForNode(node) {
  const toSplice = links.filter((l) => l.source === node || l.target === node);
  for (const l of toSplice) {
    links.splice(links.indexOf(l), 1);
  }
}

// only respond once per keydown
let lastKeyDown = -1;

function keydown() {
  d3.event.preventDefault();

  if (lastKeyDown !== -1) return;
  lastKeyDown = d3.event.keyCode;

  // ctrl
  if (d3.event.keyCode === 17) {
    circle.call(drag);
    svg.classed('ctrl', true); // ctrl というクラスをつける
    return;
  }

  if ((selectedNode.length==0) && !selectedLink) return;

  switch (d3.event.keyCode) {
    case 8: // backspace
    case 46: // deblete
      if (selectedNode !== null) {
        // 偶数だけが削除されない
        //nodes.splice(nodes.indexOf(selectedNode), 1);
        for (let selectednode of selectedNode){
        //for (const node of nodes){
          console.log(nodes.length, selectedNode.length) // 根本的にfor段階で5,4,3と止まってる
          // 最初の数を起点として偶数がやはり飛ばされていることがわかった。
          if (selectedNode.indexOf(selectednode) >= 0){
            console.log(nodes.length);
            console.log(selectedNode.length);
            console.log(selectedNode.indexOf(selectednode))
            // 5つ洗濯した時5,4,3,と返したので偶数以外
            nodes.splice(nodes.indexOf(selectednode),1);
            selectedNode.splice(selectedNode.indexOf(selectednode),1);
            spliceLinksForNode(selectednode);
          }else{
            console.log('exception')
          }
        };
      } else if (selectedLink) {
        links.splice(links.indexOf(selectedLink), 1);
      }
      selectedLink = null;
      //selectedNode = null;
      restart();
      break;
    case 66: // B
      if (selectedLink) {
        // set link direction to both left and right
        selectedLink.left = true;
        selectedLink.right = true;
      }
      restart();
      break;
    case 76: // L
      if (selectedLink) {
        // set link direction to left only
        selectedLink.left = true;
        selectedLink.right = false;
      }
      restart();
      break;
    case 82: // R
      if (selectedNode) {
        // toggle node reflexivity
        selectedNode.reflexive = !selectedNode.reflexive;
      } else if (selectedLink) {
        // set link direction to right only
        selectedLink.left = false;
        selectedLink.right = true;
      }
      restart();
      break;
  }
}

function keyup() {
  lastKeyDown = -1;

  // ctrl
  if (d3.event.keyCode === 17) {
    circle.on('.drag', null);
    svg.classed('ctrl', false);
  }
}

// app starts here
svg.on('mousedown', mousedown)  // mousedown : 
  .on('mousemove', mousemove)
  .on('mouseup', mouseup);
d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);
restart();
