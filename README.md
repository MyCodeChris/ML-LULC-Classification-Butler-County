# Performance Comparison of Machine Learning Algorithms for Land Cover Classification

[![DOI](https://img.shields.io/badge/DOI-10.1080%2F10095020.2026.2667719-blue)](https://doi.org/10.1080/10095020.2026.2667719)
[![Data](https://img.shields.io/badge/Data-Mendeley-red)](https://data.mendeley.com/datasets/wxbwz869jg/2)
[![License: CC0](https://img.shields.io/badge/License-CC0%201.0-lightgrey)](https://creativecommons.org/publicdomain/zero/1.0/)

## 📄 Paper
Christopher Atta Amponsah, Prince Obosu, Clifford Boateng, Augustine Ofobi Aborah,
Thomas Waliba & Kwame Obeng (13 May 2026): Performance comparison of machine learning
algorithms for land cover classification, *Geo-spatial Information Science*,
DOI: 10.1080/10095020.2026.2667719  
🔗 https://doi.org/10.1080/10095020.2026.2667719

---

## 📌 Overview
This repository contains all code and data used in the above study, which evaluates the
seasonal performance of six machine learning (ML) algorithms for land use and land cover
(LULC) classification using Sentinel-2 imagery on the Google Earth Engine (GEE) platform.

**Study area:** Butler County, Ohio, USA  
**Seasons analysed:** Spring · Summer · Fall · Winter (2024)  
**Algorithms compared:** Random Forest (RF), Support Vector Machine (SVM),
k-Nearest Neighbour (k-NN), Gradient Tree Boost (GTB),
Classification and Regression Tree (CART), Naïve Bayes (NB)  
**Accuracy metrics:** Overall Accuracy (OA), Kappa Coefficient, F1-Score

---

## 📁 Repository Structure

```
ML-LULC-Classification-Butler-County/
│
├── GEE_Code/
│   ├── Fall_Classification.js
│   ├── Spring_Classification.js
│   ├── Summer_Classification.js
│   └── Winter_Classification.js
│
├── Python_Code/
│   └── Confusion_Matrix_Visualization.ipynb
│
├── R_Code/
│   └── Seasonal_Accuracy_Barplot.R
│
└── Data/
    └── SamplePoints/
```

## 🗂️ Data
The dataset (shapefiles of training/validation sample points) is also archived on Mendeley Data:

🔗 https://data.mendeley.com/datasets/wxbwz869jg/2  
**DOI:** 10.17632/wxbwz869jg.2

---

## 🔁 How to Reproduce

### Google Earth Engine (GEE) Classification
1. Create a free account at [code.earthengine.google.com](https://code.earthengine.google.com)
2. Open the script for the season you want to reproduce from the `GEE_Code/` folder,
   or use the direct GEE links below:
   - 🍂 **Fall:** https://code.earthengine.google.com/3944eb07ce122cf3a71feaf0f864bf83
   - 🌸 **Spring:** https://code.earthengine.google.com/58085ac00f809913b9539ff57bc7a6da
   - ☀️ **Summer:** https://code.earthengine.google.com/5e468b5ae244cb05c73363156c302a1f
   - ❄️ **Winter:** https://code.earthengine.google.com/aee437ad95ccf06557e62bbf6b49d68d
3. To run a specific algorithm, comment out all other algorithms in the script,
   leaving only the one of interest active
4. To export results, update the filename in the export section and run the code

### Confusion Matrix Visualisation (Figure 5)
- Open `Python_Code/Confusion_Matrix_Visualization.ipynb` in Google Colab or Jupyter Notebook
- Required libraries: `matplotlib`, `seaborn`, `numpy`

### Seasonal Accuracy Comparison Plot (Figure 6)
- Open `R_Code/Seasonal_Accuracy_Barplot.R` in RStudio
- Required packages: `ggplot2`, `tidyr`, `dplyr`

---

## 📊 Key Results

| Algorithm | Avg OA (%) | Avg Kappa (%) | Avg F1 |
|-----------|------------|---------------|--------|
| k-NN      | 95.76      | 94.70         | 0.96   |
| RF        | 95.45      | 94.32         | 0.95   |
| SVM       | 94.24      | 92.80         | 0.94   |
| GTB       | 93.94      | 92.43         | 0.94   |
| CART      | 92.28      | 90.34         | 0.93   |
| NB        | 78.94      | 73.68         | 0.78   |

**Best season overall:** Spring (highest classification accuracy across all algorithms)  
**Best algorithm overall:** k-NN (highest average OA, Kappa, and F1 across all seasons)

---

## 👥 Authors
- **Christopher Atta Amponsah** — University of South Florida, Tampa, FL, USA
- **Prince Obosu** — University of Maine, Orono, ME, USA
- **Clifford Boateng** — Mississippi State University, Starkville, MS, USA
- **Augustine Ofobi Aborah** — University of Münster, Münster, Germany
- **Thomas Waliba** — University of Münster, Münster, Germany
- **Kwame Obeng** — Kwame Nkrumah University of Science and Technology, Kumasi, Ghana

---

## 📬 Contact
**Christopher Atta Amponsah**  
📧 attaamponsahc@usf.edu  
🔗 [ORCID: 0009-0009-2702-3150](https://orcid.org/0009-0009-2702-3150)

---

## 🏛️ Acknowledgements
The authors acknowledge the Google Earth Engine platform and the European Union
Space Programme (Copernicus) for enabling seamless data collection, preprocessing,
and LULC analysis in this study.
