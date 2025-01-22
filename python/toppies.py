import pandas as pd

# List of players and their respective CSV file names
players = {
    'Shai Gilgeous-Alexander': 'data/shai.csv',
    'Giannis Antetokounmpo': 'data/giannis.csv',
    'Nikola Jokić': 'data/jokic.csv',
    'LaMelo Ball': 'data/lamelo.csv',
    'Jayson Tatum': 'data/tatum.csv',
}

# Load and process each player's data
dfs = []
for player, file in players.items():
    # Load CSV file for the player
    df = pd.read_csv(file)
    
    # Add 'Player' column
    df['Player'] = player
    
    # Add the player's dataframe to the list
    dfs.append(df)

# Find common seasons across all players
common_seasons = set(dfs[0]['Season'])
for df in dfs[1:]:
    common_seasons = common_seasons.intersection(df['Season'])

# Filter each dataframe to include only the common seasons
filtered_dfs = [df[df['Season'].isin(common_seasons)] for df in dfs]

# Concatenate the filtered dataframes
combined = pd.concat(filtered_dfs)

# Sort by Season and Player for better readability
combined = combined.sort_values(by=['Season', 'Player'])

# Save the result to a CSV file
combined.to_csv('data/top_pies.csv', index=False)

print("CSV file saved as 'data/top_pies.csv'")
