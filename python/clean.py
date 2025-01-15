import pandas as pd

#nba_trad = pd.read_csv('data/NBA_traditional2425.csv')
players_data = pd.read_csv('data/preprocessed/player_list.csv')

#joined_data = pd.merge(nba_trad, players_data[['Player', 'Position']], on='Player', how='left')

position_map = {
    'F': 'Forward',
    'C': 'Center',
    'G': 'Guard',
    'C-F': 'Center-Forward',
    'G-F': 'Guard-Forward',
    'F-G': 'Forward-Guard',
    'F-C': 'Forward-Center'
}

#joined_data['Position'] = joined_data['Position'].map(position_map).fillna(joined_data['Position'])
#joined_data.to_csv('data/full_nba_data.csv', index=False)

players_data['Position'] = players_data['Position'].map(position_map).fillna(players_data['Position'])
players_data.to_csv('data/playerslist.csv', index=False)

print("File saved as 'data/full_nba_data.csv'")