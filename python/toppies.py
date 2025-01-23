import pandas as pd

#top 5 players
players = {
    'Shai Gilgeous-Alexander': 'data/shai.csv',
    'Giannis Antetokounmpo': 'data/giannis.csv',
    'Nikola Jokić': 'data/jokic.csv',
    'LaMelo Ball': 'data/lamelo.csv',
    'Jayson Tatum': 'data/tatum.csv',
}

dfs = []
for player, file in players.items():
    df = pd.read_csv(file)
    
    df['Player'] = player
    dfs.append(df)

common_seasons = set(dfs[0]['Season'])
for df in dfs[1:]:
    common_seasons = common_seasons.intersection(df['Season'])

filtered_dfs = [df[df['Season'].isin(common_seasons)] for df in dfs]
combined = pd.concat(filtered_dfs)
combined = combined.sort_values(by=['Season', 'Player'])
combined.to_csv('data/top_pies.csv', index=False)
print("saved as 'data/top_pies.csv'")
