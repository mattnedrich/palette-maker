# palette-extractor

Palette Extractor is an interactive web tool that allows you to explore different approaches to extract color palettes from images.

# Usage
When the app starts, you simply browse and select a local image. The app then loads the image and plots in in three dimensional RGB space.

![](https://cloud.githubusercontent.com/assets/4796480/20823813/8537954c-b825-11e6-9e82-edb121d54695.png)

# Palette Extraction Algorithms
Three different palette extraction algorithms are currently supported.

## Simple Histogram Binning
The histogram binning approach partitions the RGB space into a NxNxN grid where N is a user provided value. The below image shows an example when `N=3`. Here, the space is partitioned into 27 equally sized cells. The pixels that fall within each cell are counted, and their average color value is computed. Average colors from the most populated 10 cells are selected and displayed as the color palette.

<img src="https://cloud.githubusercontent.com/assets/4796480/20823815/8cb871f6-b825-11e6-85d0-1dce7d0f53d1.png" width="500">

## Median Cut Space Partitioning
[Median cut](https://en.wikipedia.org/wiki/Median_cut) also partitions the space, though it does to in a non-uniform way. The pixel range is computed for each color dimension (red, green, and blue). Then, the dimention with the largest range is selected, and the median value is computed. The space is then split into two halves - one above the median, and one below. This process continues recursively. Each iteration, only the subspace with greatest pixel range is split. A sample partitioning looks like this:

<img src="https://cloud.githubusercontent.com/assets/4796480/20823818/8ff86308-b825-11e6-866d-05f65bb0cd22.png" width="500">

## K-Means Clustering
[K-Means](https://en.wikipedia.org/wiki/K-means_clustering) attempts to cluster the pixels into k distinct clusters. The user provides a k value as input.

Since k-means is notorious for getting stuck in local minima, the algorithm is re-run 100 times and the result with lowest error is selected. An example output from running k-means on the above image is shown below.

<img src="https://cloud.githubusercontent.com/assets/4796480/20823824/964f1062-b825-11e6-9464-ceeb9504bd53.png" width="500">
