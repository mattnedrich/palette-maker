const ImageUtil = require("./image-util.js");

const RERUN_COUNT = 10;

class KMeansRunner {

  run(k, pixels) {
    var clusters = null;
    var error = Infinity;

    // re-run several times and keep the best result
    for(var attempt=0; attempt < RERUN_COUNT; attempt++) {
      let result = this.cluster(pixels, k);
      if(result.error < error) {
        clusters = result.clusters;
        error = result.error;
      }
    }

    return {
      clusters: clusters,
      error: error
    };
  }

  cluster(pixels, k) {
    // randomly initialize means
    var means = [];
    _.times(k, () => {
      let pixel = pixels[Math.floor(Math.random() * pixels.length)];
      means.push(pixel);
    });

    var done = false;
    var result = null;
    while(!done) {
      /* console.log("iterating...");*/
      result = this.groupPointsByMeans(means, pixels);
      let newMeans = this.computeMeans(result.groups);
      done = this.isDone(means, newMeans);
      means = newMeans;
    }
    /* console.log("DONE ===========================");*/
    return {
      clusters: result.groups,
      error: result.error,
      means: result.means
    }
  }

  computeMeans(groups) {
    return _.map(groups, (group) => {
      let averageColor = ImageUtil.computeAverageColor(group);
      return {
        red: averageColor.red,
        green: averageColor.green,
        blue: averageColor.blue
      };
    });
  }

  isDone(meansA, meansB) {
    var result = false;
    _.each(meansA, (mean) => {
      var meanIsAlsoInMeansB = false
      _.each(meansB, (otherMean) => {
        if((mean.red.toFixed(2) === otherMean.red.toFixed(2)) &&
           (mean.green.toFixed(2) === otherMean.green.toFixed(2)) &&
           (mean.blue.toFixed(2) === otherMean.blue.toFixed(2))) {
          meanIsAlsoInMeansB = true;
        }
      });
      result |= meanIsAlsoInMeansB;
    });
    return result;
  }

  groupPointsByMeans(means, points) {
    var totalError = 0;
    var groups = _.map(means, (m) => { return []; });

    _.each(points, (point) => {
      var bestGroupIndex;
      var bestGroupError = Infinity;
      _.each(means, (mean, index) => {
        var error = this.distance([point.red, point.green, point.blue], [mean.red, mean.green, mean.blue]);
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

  distance(pointA, pointB) {
    let squaredDiffs = _.map(pointA, (dim, index) => {
      let diff = pointA[index] - pointB[index];
      return diff * diff;
    });
    return Math.sqrt(_.sum(squaredDiffs));
  }

}

module.exports = KMeansRunner;
