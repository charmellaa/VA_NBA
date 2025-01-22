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

pie_data = pd.read_csv('data/top_pies.csv')

def compute_eff(player): #efficiency
    PTS = player['PTS']
    REB = player['REB']
    AST = player['AST']
    STL = player['STL']
    BLK = player['BLK']
    TOV = player['TOV']
    #MIN = player['Min']
    FGA = player['FGA']
    FGM = player['FGM']
    FTA = player['FTA']
    FTM = player['FTM']



    eff = (PTS + REB + AST + STL + BLK - ((FGA - FGM) + (FTA - FTM) + TOV))
    return eff

@app.route('/get_eff_comparison', methods=['POST'])
def get_eff_comparison():
    try:
        player_name = request.json.get("playerName")
        if not player_name:
            return jsonify({"error": "playerName is required"}), 400


        selected_player = nba_data[nba_data['Player'] == player_name]
        if selected_player.empty:
            return jsonify({"error": f"Player {player_name} not found"}), 400

        selected_player = selected_player.iloc[0]

        selected_player_eff = compute_eff(selected_player)
    
        other_players = nba_data[nba_data['Player'] != player_name]
        other_players_eff = other_players.apply(compute_eff, axis=1)
        avg_eff = other_players_eff.mean()

        return jsonify({
            "selected_player_eff": selected_player_eff,
            "average_eff": avg_eff
        })

    except Exception as e:
        app.logger.error(f"Error processing request: {e}")
        return jsonify({"error": "An error occurred while processing the request"}), 500


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
    

@app.route('/analyze_trends', methods=['POST'])
def analyze_trends():
    try:
        player_name = request.json.get("playerName")
        if not player_name:
            return jsonify({"error": "Player name is required"}), 400

        # Filter data for the selected player
        player_data = pie_data[pie_data['Player'] == player_name].sort_values(by='Season')
        if player_data.empty:
            return jsonify({"error": f"Player {player_name} not found"}), 400

        # Calculate season-over-season growth rates
        player_data['PIE_Growth'] = player_data['PIE'].pct_change() * 100

        # Analyze trends
        avg_growth_rate = player_data['PIE_Growth'].mean()
        std_dev = player_data['PIE_Growth'].std()

        if avg_growth_rate > 0 and std_dev < 5:
            trend = "Consistent Growth"
        elif avg_growth_rate < 0 and std_dev < 5:
            trend = "Consistent Decline"
        elif std_dev >= 5:
            trend = "Volatile"
        else:
            trend = "Stable"

        # Return the analysis results
        return jsonify({
            "player": player_name,
            "avg_growth_rate": avg_growth_rate,
            "std_dev": std_dev,
            "trend": trend
        })

    except Exception as e:
        app.logger.error(f"Error analyzing trends for player: {e}")
        return jsonify({"error": "An error occurred while processing the request"}), 500


if __name__ == '__main__':
    app.run(debug=True)
