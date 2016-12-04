const _ = require("lodash");

class MedianCutRunner {

  determineGroupToSplit(groups) {

    let groupStats = _.map(groups, (group, index) => {
      var reds = _.map(group.points, (point) => { return point.red; });
      var greens = _.map(group.points, (point) => { return point.green; });
      var blues = _.map(group.points, (point) => { return point.blue; });

      var sumRed = _.sum(reds);
      var sumGreen = _.sum(greens);
      var sumBlue = _.sum(blues);

      var avgRed = sumRed / reds.length;
      var avgGreen = sumGreen / greens.length;
      var avgBlue = sumBlue / blues.length;

      var stats = [];
      stats.push({
        groupIndex: index,
        group: groups[index],
        name: "red",
        splitDimension: "x",
        index: 0,
        range: _.max(reds) - _.min(reds),
        variance: _.chain(reds)
                   .map( (red) => {
                     return (red - avgRed) * (red - avgRed);
                   })
                   .sum()
                   .value()
      });
      stats.push({
        groupIndex: index,
        group: groups[index],
        name: "green",
        splitDimension: "y",
        index: 1,
        range: _.max(greens) - _.min(greens),
        variance: _.chain(greens)
                   .map( (green) => {
                     return (green - avgGreen) * (green - avgGreen);
                   })
                   .sum()
                   .value()
      });
      stats.push({
        groupIndex: index,
        group: groups[index],
        name: "blue",
        splitDimension: "z",
        index: 2,
        range: _.max(blues) - _.min(blues),
        variance: _.chain(blues)
                   .map( (blue) => {
                     return (blue - avgBlue) * (blue - avgBlue);
                   })
                   .sum()
                   .value()
      });

      return _.last(_.sortBy(stats, 'range'));
    });

    var groupToSplit = _.last(_.sortBy(groupStats, 'range'));
    return groupToSplit;
  }

  splitGroup(group, splitInfo) {
    var sortedPoints = _.sortBy(group.points, (p) => {
      return p[splitInfo.name];
    });
    var medianIndex = parseInt(sortedPoints.length / 2);
    var medianValue = sortedPoints[medianIndex][splitInfo.name];

    var groupA = {
      points: [],
      xMin: group.xMin,
      xMax: group.xMax,
      yMin: group.yMin,
      yMax: group.yMax,
      zMin: group.zMin,
      zMax: group.zMax
    };
    var groupB = {
      points: [],
      xMin: group.xMin,
      xMax: group.xMax,
      yMin: group.yMin,
      yMax: group.yMax,
      zMin: group.zMin,
      zMax: group.zMax
    };

    var cut = null
    if(splitInfo.splitDimension === "x"){
      groupA.xMax = medianValue;
      groupB.xMin = medianValue;
    } else if (splitInfo.splitDimension === "y") {
      groupB.yMin = medianValue;
      groupA.yMax = medianValue;
    } else if (splitInfo.splitDimension === "z") {
      groupB.zMin = medianValue;
      groupA.zMax = medianValue;
    }

    _.each(group.points, (p) => {
      if (p[splitInfo.name] > medianValue){
        groupB.points.push(p);
      } else {
        groupA.points.push(p);
      }
    });

    cut = this.generateMeshForCut(
      group.xMin,
      group.xMax,
      group.yMin,
      group.yMax,
      group.zMin,
      group.zMax,
      splitInfo.splitDimension,
      medianValue);

    return {
      groups:[groupA, groupB],
      cut: cut
    }
  }

  generateMeshForCut(xMin, xMax, yMin, yMax, zMin, zMax, dimensionToCut, cutLocation) {
    if (dimensionToCut === "x") {
      return [
        {x: cutLocation, y: yMin, z: zMin},
        {x: cutLocation+0.1, y: yMax, z: zMin},
        {x: cutLocation+0.2, y: yMax, z: zMax},
        {x: cutLocation+0.3, y: yMin, z: zMax}
      ];
    } else if (dimensionToCut === "y") {
      return [
        {x: xMin, y: cutLocation, z: zMin},
        {x: xMax, y: cutLocation+0.1, z: zMin},
        {x: xMax, y: cutLocation+0.2, z: zMax},
        {x: xMin, y: cutLocation+0.3, z: zMax}
      ];
    } else if (dimensionToCut === "z") {
      return [
        {x: xMin, y: yMin, z: cutLocation},
        {x: xMax, y: yMin, z: cutLocation+0.1},
        {x: xMax, y: yMax, z: cutLocation+0.2},
        {x: xMin, y: yMax, z: cutLocation+0.3}
      ];
    }
  }

  run (pointGroups, cuts, currentIteration, maxIterations){
    console.log("running medianCut iteration: " + currentIteration + " of " + maxIterations);
    if (currentIteration >= maxIterations) {
      return {
        groups: pointGroups,
        cuts: cuts
      };
    }

    // determine which group has the most variation in some dimension
    var groupToSplitInfo = this.determineGroupToSplit(pointGroups);

    console.log("will split based on " + groupToSplitInfo.name);
    let result = this.splitGroup(groupToSplitInfo.group, groupToSplitInfo);
    var splitGroups = result.groups;
    var cut = result.cut;
    cuts.push(cut);

    _.pullAt(pointGroups, groupToSplitInfo.groupIndex);
    _.each(splitGroups, (g) => {
      pointGroups.push(g);
    });

    return this.run(pointGroups, cuts, currentIteration + 1, maxIterations);
  }

}

module.exports = MedianCutRunner;
