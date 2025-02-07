from flask import Flask, request, jsonify, render_template
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

from flask import send_from_directory

app = Flask(__name__, template_folder=".")

# in order to access dthe data needed for the computations
@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory('data', filename)

# preprocessed data with all the values
nba_data = pd.read_csv('data/full_nba_data.csv')
cols = ["GP", "W", "L", "Min", "PTS", "FGM", "FGA", "3PM", "3PA", "FTM",
        "FTA", "OREB", "DREB", "REB", "AST", "TOV", "STL", "BLK", "PF",
        "FP", "+/-"]

# data with top 5 players PIE (Player Efficiency Estimate over the years)
pie_data = pd.read_csv('data/top_pies.csv')

import pandas as pd

# Normalize data for the radar chart
def normalize_data():
    data = pd.read_csv('./data/full_nba_data.csv')

    # Columns to normalize
    columns_to_normalize = ['PTS', 'REB', 'AST', 'TOV', 'STL', 'BLK']

    # Min-Max scaling
    def normalize_column(column):
        return (column - column.min()) / (column.max() - column.min())

    for column in columns_to_normalize:
        data[f'{column}_n'] = normalize_column(data[column])

    normalized_path = './data/normalized_full.csv'
    data.to_csv(normalized_path, index=False)
    print(f"Normalization complete. The normalized dataset is saved as '{normalized_path}'.")
    return data


# here is the computation of the efficiency value for the bar graph besides the radar chart
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
    GP = player['GP']

        
    # formula for calculating Efficiency with general performance metrics
    eff = PTS + REB + AST + STL + BLK - ((FGA - FGM) + (FTA - FTM) + TOV)
    return eff

#### EFFICIENCY COMPARISON ####
@app.route('/get_eff_comparison', methods=['POST'])
def get_eff_comparison():
    try:
        player_name = request.json.get("playerName")
        if not player_name:
            return jsonify({"error": "playerName is required"}), 400


        selected_player = nba_data[nba_data['Player'] == player_name]
        if selected_player.empty:
            return jsonify({"error": f"Player {player_name} not found"}), 400

        # compute selected player's efficiency
        selected_player = selected_player.iloc[0]
        selected_player_eff = compute_eff(selected_player)

        # compute the mean of other players' efficiency
        other_players = nba_data[nba_data['Player'] != player_name]
        other_players_eff = other_players.apply(compute_eff, axis=1)
        #other_players_eff = nba_data.apply(compute_eff, axis=1)
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
    return render_template('index.html')

@app.route('/next.html')
def next():
    normalize_data()
    return render_template('next.html')

### CLUSTER NUMBER CHOICE -- K-MEANS ###
### PRINCIPAL COMPONENT ANALYSIS ###
@app.route('/pca_clusters', methods=['POST'])
def pca_clusters():
    try:
        n_clusters = int(request.json.get("clusters", 3))  # Default to 3 clusters
        position_filter = request.json.get("position", "All positions")  # Get position filter

        # Filter dataset by position, otherwise do PCA on "All positions"
        if position_filter != "All positions":
            filtered_data = nba_data[nba_data["Position"] == position_filter]
        else:
            filtered_data = nba_data

        # Data preprocessing and PCA
        data = filtered_data[cols]
        data_scaled = StandardScaler().fit_transform(data)

        pca = PCA(n_components=2)
        pca_results = pca.fit_transform(data_scaled)

        # Apply KMeans clustering
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        cluster_labels = kmeans.fit_predict(pca_results)

        # Prepare data for the response
        pca_df = pd.DataFrame(pca_results, columns=["PC1", "PC2"])
        pca_df["Player"] = filtered_data["Player"].values
        pca_df["Cluster"] = pca_df["Cluster"] = ["Cluster " + str(label + 1) for label in cluster_labels]
        
        # Save results to a file
        if position_filter == "All positions":
            file_name = "data/pca_results.csv"
        else:
            file_name = f"data/pca_{position_filter.replace('-', '_')}.csv"

        pca_df.to_csv(file_name, index=False)

        return jsonify(pca_df.to_dict(orient="records"))
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    

### PIE (Player's Impact Estimate) AND GROWTH RATE OVER THE SEASONS (FROM 2020) ###
@app.route('/analyze_trends', methods=['POST'])
def analyze_trends():
    try:
        data = request.json
        player_name = data.get("playerName")
        #default values
        growth_threshold = data.get("growthThreshold", 0.5) 
        volatility_threshold = data.get("volatilityThreshold", 10.5)  

        if not player_name:
            return jsonify({"error": "Player name is required"}), 400

        player_data = pie_data[pie_data['Player'] == player_name].sort_values(by='Season')
        if player_data.empty:
            return jsonify({"error": f"Player {player_name} not found"}), 400

        # season-over-season pie percentage change
        player_data['PIE_Growth'] = player_data['PIE'].pct_change() * 100
        #print(f"PIE Growth for {player_name}:\n{player_data[['Season', 'PIE_Growth']]}")


        # Analyze trends: using mean and standard deviation
        avg_growth_rate = player_data['PIE_Growth'].mean()
        sd = player_data['PIE_Growth'].std()


        if avg_growth_rate > growth_threshold and sd < volatility_threshold:
            trend = "Growth"
        elif avg_growth_rate < -growth_threshold and sd < volatility_threshold:
            trend = "Decline"
        elif abs(avg_growth_rate) < growth_threshold and sd < volatility_threshold:
            trend = "Stable"
        else:
            trend = "Volatile"

        # Return the analysis results
        return jsonify({
            "player": player_name,
            "avg_growth_rate": avg_growth_rate,
            "std_dev": sd,
            "trend": trend
        })

    except Exception as e:
        app.logger.error(f"Error analyzing trends for player: {e}")
        return jsonify({"error": "An error occurred while processing the request"}), 500



if __name__ == '__main__':
    app.run(debug=True)
