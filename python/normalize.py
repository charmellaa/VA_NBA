import pandas as pd


# Normalize data for radar chart
data = pd.read_csv('./data/full_nba_data.csv')

# columns to normalize
columns_to_normalize = ['PTS', 'REB', 'AST', 'TOV', 'STL', 'BLK']

# Min-Max scaling
def normalize_column(column):
    return (column - column.min()) / (column.max() - column.min())

for column in columns_to_normalize:
    data[f'{column}_n'] = normalize_column(data[column])

data.to_csv('./data/normalized_full.csv', index=False)

print("Normalization complete. The normalized dataset is saved as 'normalized_dataset.csv'.")
