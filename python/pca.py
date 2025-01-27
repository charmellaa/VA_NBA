import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import numpy as np

# import matplotlib.pyplot as plt
# import seaborn as sns

nba_data = pd.read_csv('data/full_nba_data.csv')

#consider only the numerical columns
cols = ["GP", "W", "L", "Min", "PTS", "FGM", "FGA", "3PM", "3PA", "FTM", 
    "FTA", "OREB", "DREB", "REB", "AST", "TOV", "STL", "BLK", "PF", 
    "FP", "+/-"]

data = nba_data[cols]

data_scaled = StandardScaler().fit_transform(data)

#scaler = StandardScaler()
#data_scaled = scaler.fit_transform(data)

pca = PCA(n_components=2)
pca_results = pca.fit_transform(data_scaled)


# print(data_scaled)

# Access the PCA components (eigenvectors)
# pca_components = pd.DataFrame(pca.components_, columns=cols, index=["PC1", "PC2"])
# print(pca_components)
# Proportion of variance explained by each component
# explained_variance = pca.explained_variance_ratio_
# print("Explained variance ratio:", explained_variance)
# plt.figure(figsize=(10, 6))
# sns.barplot(x=cols, y=pca_components.loc["PC1"], color='blue', label="PC1")
# sns.barplot(x=cols, y=pca_components.loc["PC2"], color='red', alpha=0.5, label="PC2")
# plt.xticks(rotation=90)
# plt.legend()
# plt.title("Feature Contributions to Principal Components")
# plt.show()


pca_df = pd.DataFrame(pca_results, columns=["PC1", "PC2"])
pca_df["Player"] = nba_data["Player"]
pca_df["Cluster"] = pd.cut(pca_df["PC1"], bins=3, labels=["Cluster 1", "Cluster 2", "Cluster 3"])  # Example clustering
pca_df.to_csv("data/pca_results.csv", index=False)

print("PCA analysis completed. Saved to data/pca_results.csv")