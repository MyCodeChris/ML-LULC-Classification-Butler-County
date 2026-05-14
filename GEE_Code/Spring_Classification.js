var butler = ee.FeatureCollection('TIGER/2018/Counties')
                      .filter(ee.Filter.eq('NAME', 'Butler'))
                      .filter(ee.Filter.eq('STATEFP', '39')); // Ohio's state code
var visParams = {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000, };
//var visparams = {bands: ['SR_B5', 'SR_B4', 'SR_B3'], min: 0, max: 0.5, };

var filtered = s2
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 5))
  .filter(ee.Filter.date('2025-03-01', '2025-04-01'))
  .filter(ee.Filter.bounds(butler));
  
print(filtered.size())
print("Butler area", butler.geometry().area())

var composite = filtered.median().clip(butler);
Map.centerObject(butler,10)


Map.addLayer(composite, visParams, "Sentinel 2")



var addIndices = function(image) {
  var evi = image.expression(
      '2.5*(( M - N ) / (M + 6*N - 7.5*J + 1)) ', {
        'M': image.select('B8'), //NIR
        'N': image.select('B4'),  //red
        'J': image.select('B2'),  //blue
  }).rename('evi');
  var ndbi = image.normalizedDifference(['B11', 'B8']).rename(['ndbi']);
  var mndwi = image.normalizedDifference(['B3', 'B11']).rename(['mndwi']); 
  var bsi = image.expression(
      '(( X + Y ) - (A + B)) /(( X + Y ) + (A + B)) ', {
        'X': image.select('B11'), //swir1
        'Y': image.select('B4'),  //red
        'A': image.select('B8'), // nir
        'B': image.select('B2'), // blue
  }).rename('bsi');
  return image.addBands(evi).addBands(ndbi).addBands(mndwi).addBands(bsi);
};

var composite = addIndices(composite);

var bands = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B9','B11', 'B12', 'evi', 'ndbi', 'mndwi', 'bsi' ];

var composite = composite.select(bands)


// Add a random column and split the GCPs into training and validation set
var gcp = ee.FeatureCollection(water.merge(builtups).merge(open_area).merge(forest).merge(farmland));

// Add a random key (used to shuffle points within each class)
gcp = gcp.randomColumn('rand');

// Get distinct class labels (server-side list)
var classes = ee.List(gcp.aggregate_array('landcover')).distinct();

// Helper: compute training collection by iterating over classes
var emptyFC = ee.FeatureCollection([]);

// Build trainingGcp by iterating classes
var trainingGcp = ee.FeatureCollection(
  classes.iterate(function(c, acc) {
    c = ee.Number(c); // or ee.String(c) depending on your 'landcover' type
    acc = ee.FeatureCollection(acc);

    // Filter points of this class and sort by random value
    var classPts = gcp.filter(ee.Filter.eq('landcover', c)).sort('rand');

    // total count (server-side number)
    var total = classPts.size();

    // exact train size = floor(total * 0.7)
    var trainSize = ee.Number(total).multiply(0.7).floor().toInt();

    // convert to list and slice
    var classList = classPts.toList(total);
    var trainList = classList.slice(0, trainSize);

    var trainFC = ee.FeatureCollection(trainList);

    // merge into accumulator
    return acc.merge(trainFC);
  }, emptyFC)
);

// Build validationGcp similarly
var validationGcp = ee.FeatureCollection(
  classes.iterate(function(c, acc) {
    c = ee.Number(c);
    acc = ee.FeatureCollection(acc);

    var classPts = gcp.filter(ee.Filter.eq('landcover', c)).sort('rand');
    var total = classPts.size();
    var trainSize = ee.Number(total).multiply(0.7).floor().toInt();

    var classList = classPts.toList(total);
    var valList = classList.slice(trainSize, total);

    var valFC = ee.FeatureCollection(valList);

    return acc.merge(valFC);
  }, emptyFC)
);

// Print sizes and some samples to verify
print('Distinct classes:', classes);
print('Total GCP count:', gcp.size());
print('Training GCP count (should be 70% per class):', trainingGcp.size());
print('Validation GCP count (should be 30% per class):', validationGcp.size());

// Optionally inspect first few features of each
print('Training sample (limit 5):', trainingGcp.limit(5));
print('Validation sample (limit 5):', validationGcp.limit(5));

// Print the training GCP collection to inspect its contents
print('Training GCP collection:', trainingGcp);

// Overlay the point on the image to get training data.
var training = composite.sampleRegions({
  collection: trainingGcp,
  properties: ["landcover"],
  scale: 10,
  tileScale: 16
});


print("Training:", training);

// Train a classifier.
//To run for a particular algorithm, Comment all the other algorithms leaving
//only the algorithm of interest uncommented and active

// // Gradient Tree Boost
// var classifier = ee.Classifier.smileGradientTreeBoost({
//   numberOfTrees: 100,
// }).train({
//   features: training,  
//   classProperty: 'landcover',
//   inputProperties: composite.bandNames()
// });


// //Random Forest - #500 Trees
// var classifier = ee.Classifier.smileRandomForest({
//   numberOfTrees: 500,
// }).train({
//   features: training,  
//   classProperty: 'landcover',
//   inputProperties: composite.bandNames()
// });

// //SVM - #Default
// var classifier = ee.Classifier.libsvm({})
// .train({
//   features: training,  
//   classProperty: 'landcover',
//   inputProperties: composite.bandNames()
// });

// //Smile CART - #Default
// var classifier = ee.Classifier.smileCart()
// .train({
//   features: training,  
//   classProperty: 'landcover',
//   inputProperties: composite.bandNames()
// });


//KNN - # k=5
var classifier = ee.Classifier.smileKNN({
  k: 5
}).train({
  features: training,  
  classProperty: 'landcover',
  inputProperties: composite.bandNames()
});


// //Naive Bayes - #Default
// var classifier = ee.Classifier.smileNaiveBayes()
// .train({
//   features: training,  
//   classProperty: 'landcover',
//   inputProperties: composite.bandNames()
// });

// Classify the image.
var classified = composite.classify(classifier);

var palette = ['#3535d0', '#e93c0d', "#8a8d8c", '#428b44', '#2ae24f' ];
Map.addLayer(classified.clip(butler), {min: 0, max: 4, palette: palette}, '2020');

//************************************************************************** 
// Accuracy Assessment
//************************************************************************** 

// Use classification map to assess accuracy using the validation fraction
// of the overall training set created above.
var test = classified.sampleRegions({
  collection: validationGcp,
  properties: ['landcover'],
  scale: 10,
  tileScale: 16
});

var testConfusionMatrix = test.errorMatrix('landcover', 'classification');

// Printing of confusion matrix may time out. Alternatively, you can export it as CSV
print('Confusion Matrix', testConfusionMatrix);
print('Test Accuracy', testConfusionMatrix.accuracy());
print('Kappa Coefficient', testConfusionMatrix.kappa());


print('Producer Accuracy:', testConfusionMatrix.producersAccuracy());
print('Consumer Accuracy:', testConfusionMatrix.consumersAccuracy());


//CM To CSV
// Get the numeric array from the confusion matrix
var cmArray = ee.Array(testConfusionMatrix.array());

// Convert the array to a list of lists
var cmList = ee.List(cmArray.toList());

// Convert to a FeatureCollection where each row is a feature
var fc = ee.FeatureCollection(
  cmList.map(function(row) {
    return ee.Feature(null, {row: row});
  })
);

// Export as CSV
Export.table.toDrive({
  collection: fc,
  description: 'kNN_Spring_confusion_matrix_csv',
  fileFormat: 'CSV'
});


//To download or export the data for a particular algorithm. make sure to change the file name to fit
// the active algorithm

Export.image.toDrive({
image: classified,
description: 'spring_Cart',
folder: 'pub_images',
fileNamePrefix: 'spring_Cart',
region: butler,
scale: 30,
maxPixels: 1e9
});


///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
var cm = testConfusionMatrix;

// Print raw items
print("Confusion Matrix", cm);
print("Overall Accuracy", cm.accuracy());
print("Kappa", cm.kappa());

// Producers Accuracy (Recall) — is an ee.Array
var recallArray = cm.producersAccuracy();

// Convert array → list
// Example: [[1], [0.93], ...] → [1, 0.93, ...]
var recall = recallArray.toList().map(function(x){
  return ee.Number(ee.List(x).get(0));
});
print("Recall (Producer Accuracy)", recall);



// Consumers Accuracy (Precision) — also an ee.Array
var precisionArray = cm.consumersAccuracy();

// Convert array → list (nested)
var precisionNested = precisionArray.toList();

// Unwrap first list: [ [1,0.93,...] ] → [1,0.93,...]
var precision = ee.List(precisionNested.get(0));
print("Precision (Consumer Accuracy)", precision);



var numClasses = recall.length();

var f1 = ee.List.sequence(0, numClasses.subtract(1)).map(function(i){
  var p = ee.Number(precision.get(i));
  var r = ee.Number(recall.get(i));
  
  return ee.Algorithms.If(
    p.add(r).neq(0),
    p.multiply(r).multiply(2).divide(p.add(r)),
    0
  );
});
print("F1-score per Class", f1);


var macroF1 = ee.Number(f1.reduce(ee.Reducer.mean()));
print("Macro F1-score", macroF1);


// rowTotals is an ee.Array → convert to list
var matrixArray = ee.Array(cm.array());
var rowTotals = matrixArray.reduce('sum', [1]);  // class sample counts
var totalSamples = rowTotals.reduce('sum', [0]);

var rowTotalsList = rowTotals.toList().map(function(x){
  return ee.Number(ee.List(x).get(0));   // extract scalar
});
print("Row totals (samples per class)", rowTotalsList);

// total samples
var totalSamples = ee.Number(rowTotalsList.reduce(ee.Reducer.sum()));
print("Total samples", totalSamples);

var weightedF1 = ee.Number(
  ee.List.sequence(0, numClasses.subtract(1)).map(function(i){
    var weight = ee.Number(rowTotalsList.get(i)).divide(totalSamples);
    return ee.Number(f1.get(i)).multiply(weight);
  }).reduce(ee.Reducer.sum())
);

print("Weighted F1-score", weightedF1);


