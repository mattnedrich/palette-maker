class HistogramPalettePlotter {

  computeMeshesForHist(bucketsPerDimension){
    var bucketSize = (255 / bucketsPerDimension);
    var numPlanes = bucketsPerDimension - 1;
    var planes = []

    // small offsets are used to get around plotting limitations
    var currentHeight = bucketSize;
    _.times(numPlanes, () => {
      planes.push(
        [{x: currentHeight, y: 0, z: 0},
         {x: currentHeight+0.1, y: 255, z: 0},
         {x: currentHeight+0.2, y: 255, z: 255},
         {x: currentHeight+0.3, y: 0, z: 255}]
      );
      currentHeight += bucketSize;
    });

    currentHeight = bucketSize;
    _.times(numPlanes, () => {
      planes.push(
        [{z: currentHeight, y: 0, x: 0},
         {z: currentHeight+0.1, y: 255, x: 0},
         {z: currentHeight+0.2, y: 255, x: 255},
         {z: currentHeight+0.3, y: 0, x: 255}]
      );
      currentHeight += bucketSize;
    });

    currentHeight = bucketSize;
    _.times(numPlanes, () => {
      planes.push(
        [{y: currentHeight, x: 0, z: 0},
         {y: currentHeight+0.1, x: 255, z: 0},
         {y: currentHeight+0.2, x: 255, z: 255},
         {y: currentHeight+0.3, x: 0, z: 255}]
      );
      currentHeight += bucketSize;
    });
    return planes;
  }

  plot(elementId, pixels, buckets, bucketColors, bucketsPerDimension) {
    let plotlyColors = _.map(bucketColors, (averageColor) => {
      return "rgb(" + parseInt(averageColor.red) + "," + parseInt(averageColor.green) + "," + parseInt(averageColor.blue) + ")";
    });

    let data = {
      x: _.map(pixels, (p) => { return p.red; }),
      y: _.map(pixels, (p) => { return p.green; }),
      z: _.map(pixels, (p) => { return p.blue; }),
      mode: 'markers',
      marker: {
        size: 3,
        color: plotlyColors,
        line: {
          color: 'rgb(100,100,100)',
          width: 1
        }
      },
      name: "points",
      type: 'scatter3d'
    };

    let planes = this.computeMeshesForHist(bucketsPerDimension);
    let meshes = _.map(planes, (plane) => {
      var allX = _.map(plane, (point) => {
        return point.x;
      });
      var allY = _.map(plane, (point) => {
        return point.y;
      });
      var allZ = _.map(plane, (point) => {
        return point.z;
      });
      return {
        opacity:0.175,
        color:'rgb(100,100,100)',
        type: 'mesh3d',
        x: allX,
        y: allY,
        z: allZ,
        name: "grid"
      };
    });

    let allItemsToPlot = meshes;
    allItemsToPlot.push(data);

    let layout = {
      legend: {
        type: "grid",
      },
      margin: { l:0, r:0, b: 0, t: 0 },
      scene: {
        xaxis: { title: "Red" },
        yaxis: { title: "Green"},
        zaxis: { title: "Blue"}
      }
    };

    Plotly.newPlot(elementId, allItemsToPlot, layout);
  }

}

module.exports = HistogramPalettePlotter;
