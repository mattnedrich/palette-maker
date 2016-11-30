
// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
} else {
  alert('The File APIs are not fully supported in this browser.');
}

var image = null;
var timerId;
function handleFileSelect(evt) {
  var file = evt.target.files[0]; // FileList object

  console.log("file is " + file);

  var start = 0;
  var stop = file.size - 1;

  var reader = new FileReader();

  reader.onload = (function(theFile) {
    return function(e) {
      image = document.getElementById('original-image');
      image.src = e.target.result;
      // _.each(images, function(i){
      //   i.src = e.target.result;
      //   image = i;
      // });

      $("#source-image").show();
      $("#plot-content").show();

      $(".input-image-panel").hide();
      $("#input-image-plot").hide();

      $("#histogram-output").hide();
      $("#median-cut-output").hide();
      $("#kmeans-output").hide();

    };
  })(file);

  $("#original-image").attr("src","");
  timerId = setInterval(showImageIfPossible, 1000);
  reader.readAsDataURL(file);
}

function showImageIfPossible() {
  var imageSrc = document.getElementById("original-image").src;
  if(!_.isEmpty(imageSrc)) {
    clearInterval(timerId);
    run();
    plotOriginalData(pixels);
  } else {
    console.log("tick");
  }
}

var pixels = null;
function run(){
  var imgWidth = image.width;
  var imgHeight = image.height;
  var maxDimension = imgWidth > imgHeight ? imgWidth : imgHeight;

  var scale = maxDimension / 100;
  var canvasHeight = parseInt(imgHeight / scale);
  var canvasWidth = parseInt(imgWidth / scale);

  var canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  canvas.getContext('2d').drawImage(image, 0, 0, canvasWidth, canvasHeight);

  console.log("Canvas size: " + canvas.width + "x" + canvas.height);
  var pixelData = canvas.getContext('2d').getImageData(0, 0, 1, 1).data;
  console.log("pixel data: " + pixelData);

  pixels = [];
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

  console.log("read image, found " + pixels.length + " pixels");
}

function plotImage() {
  plotOriginalData(pixels);
}

// ========================================================================================
// =================================== Entry Functions ====================================
// ========================================================================================
function resetAlgorithmOutputs(){
  removePaletteTable("#histogram-palette");
  $("#histogram-output").hide();

  removePaletteTable("#median-cut-palette");
  $("#median-cut-output").hide();

  removePaletteTable("#kmeans-palette");
  $("#kmeans-output").hide();
}

function runHistogram() {
  removePaletteTable("#histogram-palette");
  $("#histogram-output").hide();
  var histogramInputValue = parseInt($("#histogram-input").val());
  console.log("running histogram with grid size of " + histogramInputValue);
  histogramAndPlot(pixels, histogramInputValue);
}

function runMedianCut() {
  removePaletteTable("#median-cut-palette");
  $("#median-cut-output").hide();
  var medianCutInputValue = parseInt($("#median-cut-input").val());
  console.log("running median cut with input " + medianCutInputValue);
  medianCutAndPlot(pixels, medianCutInputValue);
}

function runKMeans(){
  removePaletteTable("#kmeans-palette");
  $("#kmeans-output").hide();
  var kMeansInputValue = parseInt($("#kmeans-input").val());
  console.log("running kmeans with input " + kMeansInputValue);
  kMeansAndPlot(pixels, kMeansInputValue, 100);
}
// ========================================================================================
// ========================================================================================
// ========================================================================================

function getKeyForPixel(pixel, bucketsPerDimension) {
  var bucketSize = 256 / bucketsPerDimension;
  var redBucket = Math.floor(pixel.red / bucketSize);
  var greenBucket = Math.floor(pixel.green / bucketSize);
  var blueBucket = Math.floor(pixel.blue / bucketSize);
  var key = redBucket + ":" + greenBucket + ":" + blueBucket;
  return key;
}

function pixelToString(pixel) {
  return "r: " + pixel.red + ", g: " + pixel.green + ", b: " + pixel.blue;
}

function numberToPaddedHexString(number) {
  var hexString = parseInt(number).toString(16);
  if(hexString.length == 1) {
    return "0" + hexString;
  }
  return hexString
}

function pixelToHexString(pixel) {
  var hexString = "#" +
                  numberToPaddedHexString(pixel.red) +
                  numberToPaddedHexString(pixel.green) +
                  numberToPaddedHexString(pixel.blue);
  return hexString;
}

function getColorPreviewHtmlString(color) {
  var color = pixelToHexString(color);
  return "<div class=\"colorPreview\" style=\"background:" + color + "\"></div>";
}

function removePaletteTable(containerId) {
  $(containerId).empty();
}

function drawPaletteTable(containerId, pixelGroups) {
  var paletteTableString = "";

  // Table Header
  paletteTableString += "<tr>";
  paletteTableString += "<th>Color Code</th>";
  paletteTableString += "<th>Color</th>";
  paletteTableString += "<th>Percent</th>";
  paletteTableString += "</tr>";

  var totalPixels = _.chain(pixelGroups)
                     .map(function(b) {return b.length;})
                     .sum()
                     .value();

  pixelGroups = _.sortBy(pixelGroups, function(pg) {return pg.length;}).reverse();

  _.each(pixelGroups, function(group) {
    var averageColor = computeAverageColor(group);
    var percent = group.length / totalPixels;
    paletteTableString += "<tr>";
    paletteTableString += "<td>";
    paletteTableString += pixelToHexString(averageColor);
    paletteTableString += "</td>";
    paletteTableString += "<td>";
    paletteTableString += getColorPreviewHtmlString(averageColor);
    paletteTableString += "</td>";
    paletteTableString += "<td>";
    paletteTableString += percent;
    paletteTableString += "</td>";
    paletteTableString += "</tr>";
  });
  $(containerId).append("<table class=\"table\">" + paletteTableString + "</table");
  $(containerId).show();
}

function histogramAndPlot(pixels, bucketsPerDimension) {
  var bucketMap = {};
  _.each(pixels, function(pixel){
    var key = getKeyForPixel(pixel, bucketsPerDimension);
    if(key in bucketMap) {
      bucketMap[key].push(pixel);
    } else {
      bucketMap[key] = [pixel];
      console.log("adding bucket: " + key + "for pixel " + pixelToString(pixel));
    }
  });

  // find the top N buckets
  var buckets = _.values(bucketMap);
  var sortedBuckets = _.sortBy(buckets, function(bucket) {return bucket.length; }).reverse();

  // plot code
  var colors = _.map(pixels, function(p, index){
    var key = getKeyForPixel(p, bucketsPerDimension);
    var pixelsInBucket = bucketMap[key];
    var averageColor = computeAverageColor(pixelsInBucket);
    return "rgb(" + averageColor.red + "," + averageColor.green + "," + averageColor.blue + ")";
  });

  var data = {
    x: _.map(pixels, function(p){ return p.red; }),
    y: _.map(pixels, function(p){ return p.green; }),
    z: _.map(pixels, function(p){ return p.blue; }),
    mode: 'markers',
    marker: {
      size: 3,
      color: colors,
      line: {
        color: 'rgb(100,100,100)',
        width: 1
      }
    },
    type: 'scatter3d'
  };

  var layout = {
    title: "Histogram Binned Colors",
    margin: { l:0, r:0, b: 0, t: 0 },
    xaxis: {
      title: "Red"
    },
    yaxis: {
      title: "Green"
    },
    zaxis: {
      title: "Blue"
    }
  };

  Plotly.newPlot('histogram-plot', [data], layout);

  drawPaletteTable("#histogram-palette", sortedBuckets);

  $("#histogram-output").show();
}

function plotOriginalData(pixels) {
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
      size: 3,
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

  Plotly.newPlot('input-image-plot', [data], layout);
  $("#input-image-plot").show();
  $(".input-image-panel").show();
}

function medianCutAndPlot(pixels, partitions) {
  var groups = medianCut([pixels], 0, partitions);

  console.log("=======================");
  _.each(groups, function(g){
    console.log("Cluster: " + g.length + " points");
  });
  plotClusters(groups, "median-cut-plot");
  drawPaletteTable("#median-cut-palette", groups);
  $("#median-cut-output").show();
}

// =======================================================
// ================== KMeans Start =======================
// =======================================================

function kMeansAndPlot(pixels, k, numRuns) {
  var bestResult = null;
  var bestError = Infinity;

  for(var attempt=0; attempt<numRuns; attempt++) {
    result = kMeans(pixels, k);
    if(result.error < bestError) {
      bestResult = result.groups;
      bestError = result.error;
    }
  }
  plotClusters(bestResult, "kmeans-plot");
  drawPaletteTable("#kmeans-palette", bestResult);
  $("#kmeans-output").show();
}

function kMeans(pixels, k) {
  // randomly initialize means
  var means = [];
  for(m=0; m<k; m++){
    var pixel = pixels[Math.floor(Math.random()*pixels.length)];
    means.push(pixel);
  }

  var done = false;
  var result = null;
  while(!done) {
    result = groupPointsByMeans(means, pixels);
    newMeans = computeMeans(result.groups);
    done = isDone(means, newMeans);
  }

  console.log("Finished KMeans, error is " + result.error);
  return {
    groups: result.groups,
    error: result.error
  };
}

function computeMeans(groups) {
  return _.map(groups, function(group) {
    var averageColor = computeAverageColor(group);
    return [averageColor.red, averageColor.green, averageColor.blue];
  });
}

function isDone(meansA, meansB) {
  var result = true;
  _.each(meansA, function(mean) {
    result = result | _.includes(meansB, mean);
  });
  return result;
}

function groupPointsByMeans(means, points) {
  var totalError = 0;
  var groups = _.map(means, function(m) { return []; });

  _.each(points, function(point) {
    var bestGroupIndex;
    var bestGroupError = Infinity;
    _.each(means, function(mean, index) {
      var error = distance(point, mean);
      if (error < bestGroupError) {
        bestGroupError = error;
        bestGroupIndex = index;
      }
    });
    groups[bestGroupIndex].push(point);
    totalError += bestGroupError;
  });
  return {
    means: means,
    groups: groups,
    error: totalError
  };
}

function distance(pointA, pointB) {
  var squaredDiffs = _.map(pointA, function(dim, index) {
    var diff = pointA[index] - pointB[index];
    return diff * diff;
  });
  return Math.sqrt(_.sum(squaredDiffs));
}

// =======================================================
// ================== KMeans End =========================
// =======================================================

function computeAverageColor(points){
  var totalRed = _.chain(points)
        .map(function(p){ return p.red; })
        .sum()
        .value();
  var totalGreen = _.chain(points)
        .map(function(p){ return p.green; })
        .sum()
        .value();
  var totalBlue = _.chain(points)
        .map(function(p){ return p.blue; })
        .sum()
        .value();
  return {
    red: (totalRed / points.length),
    green: (totalGreen / points.length),
    blue: (totalBlue / points.length)
  };
}

function plotClusters(pointGroups, elementId){
  var data = _.map(pointGroups, function(group){
    var avgColor = computeAverageColor(group);
    var colorString = "rgb(" + parseInt(avgColor.red) + "," + parseInt(avgColor.green) + "," + parseInt(avgColor.blue) + ")";
    return {
      x: _.map(group, function(p){ return p.red; }),
      y: _.map(group, function(p){ return p.green; }),
      z: _.map(group, function(p){ return p.blue; }),
      mode: 'markers',
      marker: {
        color: colorString,
        size: 3,
        line: {
          color: 'rgb(100,100,100)',
          width: 1
        }
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

