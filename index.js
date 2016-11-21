// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.

} else {
  alert('The File APIs are not fully supported in this browser.');
}

function handleFileSelect(evt) {
  var file = evt.target.files[0]; // FileList object

  console.log("file is " + file);

  var start = 0;
  var stop = file.size - 1;

  var reader = new FileReader();

  reader.onload = (function(theFile) {
    return function(e) {
      var span = document.createElement('span');
      span.innerHTML = ['<img id=img src="', e.target.result,
                        '" title="', escape(theFile.name), '"/>'].join('');
      document.getElementById('original-image-hidden').insertBefore(span, null);
      var img = document.getElementById('img');

      var image = document.getElementById('original-image');
      image.src = e.target.result;

      run();
    };
  })(file);

  reader.readAsDataURL(file);
}

function run(){
  var canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);

  console.log("Canvas size: " + canvas.width + "x" + canvas.height);
  var pixelData = canvas.getContext('2d').getImageData(0, 0, 1, 1).data;
  console.log("pixel data: " + pixelData);

  var pixels = [];
  for (var x=0; x < canvas.width; x++){
    for (var y=0; y < canvas.height; y++){
      var pixel = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
      pixels.push({
        red: pixel[0],
        green: pixel[1],
        blue: pixel[2]
      });
    }
  }
  plotWithPlotly(pixels);
}

function plotWithPlotly(pixels){

  console.log("will plot " + pixels.length + " pixels");
  var colors = _.map(pixels, function(p, index){
    return "rgb(" + p.red + "," + p.green + "," + p.blue + ")";
  });

  var data = {
    x: _.map(pixels, function(p){ return p.red; }),
    y: _.map(pixels, function(p){ return p.green; }),
    z: _.map(pixels, function(p){ return p.blue; }),
    mode: 'markers',
    marker: {
      size: 5,
      color: colors,
      line: {
        color: 'rgb(100,100,100)',
        width: 1
      }
    },
    type: 'scatter3d'
  };

  var layout = {
    margin: { l:0, r:0, b: 0, t: 0 }
  };

  // Plotly.newPlot('plot', [data], layout);

  var groups = medianCut([pixels], 0, 10);

  console.log("=======================")
  _.each(groups, function(g){
    console.log("Cluster: " + g.length + " points");
  });
  plotClusters(groups, "plot2");
}

function plotClusters(pointGroups, elementId){
  var data = _.map(pointGroups, function(group){
    return {
      x: _.map(group, function(p){ return p.red; }),
      y: _.map(group, function(p){ return p.green; }),
      z: _.map(group, function(p){ return p.blue; }),
      mode: 'markers',
      marker: {
        size: 2,
        // line: {
        //   color: 'rgb(100,100,100)',
        //   width: 1
        // }
      },
      type: 'scatter3d'
    };
  });

  var layout = {
    margin: { l:0, r:0, b: 0, t: 0 }
  };

  Plotly.newPlot(elementId, data, layout);
}

function medianCut(pointGroups, currentIteration, maxIterations){
  console.log("running medianCut with " + pointGroups.length + " groups");
  if (currentIteration > maxIterations) {
    return pointGroups;
  }

  // determine which group has the most variation in some dimension
  var groupToSplitInfo = determineGroupToSplit(pointGroups);
  console.log("will split based on " + groupToSplitInfo.name);
  splitGroups = splitGroup(groupToSplitInfo.group, groupToSplitInfo);

  _.pullAt(pointGroups, groupToSplitInfo.groupIndex);
  _.each(splitGroups, function(g) {
    pointGroups.push(g);
  });

  return medianCut(pointGroups, currentIteration + 1, maxIterations);
};

function splitGroup(points, splitInfo) {
  var sortedPoints = _.sortBy(points, function(p){
    return p[splitInfo.name];
  });
  var medianIndex = parseInt(sortedPoints.length / 2);
  var medianValue = sortedPoints[medianIndex][splitInfo.name];
  var groupA = [];
  var groupB = [];
  _.each(points, function(p){
    if (p[splitInfo.name] > medianValue){
      groupA.push(p);
    } else {
      groupB.push(p);
    }
  });
  return [groupA, groupB];
};

function determineGroupToSplit(groups) {
  groupStats = _.map(groups, function(group, index){
    var reds = _.map(group, function(point){ return point.red; });
    var blues = _.map(group, function(point){ return point.blue; });
    var greens = _.map(group, function(point){ return point.green; });

    var stats = [];
    stats.push({
      groupIndex: index,
      group: groups[index],
      name: "red",
      index: 0,
      range: _.max(reds) - _.min(reds)
    });
    stats.push({
      groupIndex: index,
      group: groups[index],
      name: "green",
      index: 1,
      range: _.max(greens) - _.min(greens)
    });
    stats.push({
      groupIndex: index,
      group: groups[index],
      name: "blue",
      index: 2,
      range: _.max(blues) - _.min(blues)
    });

    return _.last(_.sortBy(stats, 'range'));
  });

  var groupToSplit = _.last(_.sortBy(groupStats, 'range'));
  return groupToSplit;
};

document.getElementById('files').addEventListener('change', handleFileSelect, false);
