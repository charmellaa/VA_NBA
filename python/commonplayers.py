import pandas as pd

file1 = pd.read_csv('data/nba_player_stats.csv')
file2 = pd.read_csv('data/players_data.csv')

common = set(file1['Player']).intersection(file2['Player'])

commonplayers = file2[file2['Player'].isin(common)]

commonplayers.to_csv('data/preprocessed/player_list.csv', index=False)

print("Common players created \n")