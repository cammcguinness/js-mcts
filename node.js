import numeral from 'numeral';

class UCB1{

  select(options){
    var epsilon = 1e-6;
    var best = -1;
    var bestIndex = -1;
    options.map((option,index)=>{
      var score = (option.totalValue / (option.visits+Math.random()*epsilon)) + Math.sqrt(2 * Math.log(option.parentVisits+1) / (option.visits+Math.random()*epsilon));
      if(score > best){
        best = score;
        bestIndex = index;
      }
    })
    return bestIndex;
  }
}


class Node{
  parent: ?Node;
  task: any;
  visits: number;
  selection: any;
  totalValue: number;
  action: any;
  depth: number;
  children: array;
  best: number;

  constructor(parent: Node,task: any,selection: any,action: any){
    this.parent = parent;
    this.task = task;
    this.visits = 0;
    this.selection = selection?selection:new UCB1();
    this.totalValue = 0;
    this.action = action;
    this.best = -1;
    this.depth = parent?parent.depth+1:0;
  }

  expand(){
    this.children = [];
    /*var parent = this;
    while(parent!=null){
      if(this.action!=null){

    }*/

    var actions = this.task.getPossibleActions();
    actions.map(action=>{
      this.children.push(new Node(this,this.task,this.selection,action));
    })
  }

  selectAction(){

      var current = this;
      while(current!=null&&!current.isLeaf()){

          var index = current.select();
          current = current.children[index];
          current.doAction();
      }
      current.expand();

      //current = current.children[current.select()];
      if(current!=undefined){
        current.doAction();
        var score = current.task.rollout();
        if(score > this.best){
          this.best = score;
        }
        current.backPropagate(score);
      }


  }

  select(){
      var options = [];

      this.children.map(child=>{
        options.push({parentVisits: this.visits,totalValue: child.totalValue,visits: child.visits});
      })
      var index = this.selection.select(options);
      return index;
  }

  backPropagate(score){
    var parent = this;
    while(parent!=null){
      parent.totalValue+=score;
      parent.visits++;
      parent = parent.parent;
    }
  }

  isLeaf(){
    return this.children==null||this.children.length==0;
  }

  doAction(){
    this.task.doAction(this.action);
  }

  reset(){
    this.task.reset();
  }

  getTree(path){
    var tree = [];
    // if(this.depth > 3){
    //   return tree;
    // }
    if(this.children&&this.children.length>0){
      this.children.map((child,index)=>{
        var nPath = path+index+",";
        tree.push({name: child.action.name,children: child.getTree(nPath),attributes:{visits:child.visits,average: numeral(child.totalValue/(child.visits+1)).format('0.00')},path:nPath});
      })
    }
    return tree;
  }
}


onmessage = function(event){
  var data = event.data;
  //console.log(data.task);
  var a = null;
  try{
    a = eval(data.task);
  }catch(e){
    console.error("Error: "+e.message);
  }
  if(a==null){
    return;
  }
  var task = new a();
  //var task = eval(data.task);

  //console.log(task.getPossibleActions());
  var root = new Node(null,task,null,null);
  root.expand();
  var config = data.config;
  var rounds = config.rounds;
  var report = config.report;
  //console.log("Rounds: "+rounds+", report: "+report);
  for(var i=0;i<rounds;i++){
    //console.log("Round # "+i);
    root.reset();
    root.selectAction();
    if((i+1)%report==0){
      //console.log("Round# "+i);
      postMessage(JSON.stringify({progress: 'progress',round: (i+1),best: root.best}));
    }

  }

  const myTreeData = [
    {
      name: 'Top Level',
      children: [],
    },
  ];
  myTreeData[0].attributes = {visits: root.visits,average: numeral(root.totalValue/root.visits).format('0.00')};
  myTreeData[0].children = root.getTree("");
  //console.log("Posting message");
  postMessage(JSON.stringify({progress: 'done',tree: myTreeData}));


}
