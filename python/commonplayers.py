import pandas as pd

file1 = pd.read_csv('data/full_nba_data.csv')
file2 = pd.read_csv('data/playerslist.csv')

common = set(file1['Player']).intersection(file2['Player'])

commonplayers = file1[~file1['Player'].isin(common)]

print(commonplayers)
print("Common players created \n")