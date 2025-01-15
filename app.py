from flask import Flask, request, jsonify, render_template
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

from flask import send_from_directory

app = Flask(__name__, template_folder=".")

@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory('data', filename)
# Load initial data
nba_data = pd.read_csv('data/full_nba_data.csv')
cols = ["GP", "W", "L", "Min", "PTS", "FGM", "FGA", "3PM", "3PA", "FTM",
        "FTA", "OREB", "DREB", "REB", "AST", "TOV", "STL", "BLK", "PF",
        "FP", "+/-"]

@app.route('/')
def index():
    return render_template('next.html')

@app.route('/update_clusters', methods=['POST'])
def update_clusters():
    try:
        n_clusters = int(request.json.get("clusters", 3))  # Default to 3 clusters

        # Data preprocessing and PCA
        data = nba_data[cols]
        data_scaled = StandardScaler().fit_transform(data)

        pca = PCA(n_components=2)
        pca_results = pca.fit_transform(data_scaled)

        # Apply KMeans clustering
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        cluster_labels = kmeans.fit_predict(pca_results)

        # Prepare data for the response
        pca_df = pd.DataFrame(pca_results, columns=["PC1", "PC2"])
        pca_df["Player"] = nba_data["Player"]
        pca_df["Cluster"] = pca_df["Cluster"] = ["Cluster " + str(label + 1) for label in cluster_labels]




        return jsonify(pca_df.to_dict(orient="records"))
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
