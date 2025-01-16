import pandas as pd

# Load the dataset
data = pd.read_csv('./data/full_nba_data.csv')

# Define the columns to normalize
columns_to_normalize = ['PTS', 'REB', 'AST', 'TOV', 'STL', 'BLK']

# Perform Min-Max scaling
def normalize_column(column):
    return (column - column.min()) / (column.max() - column.min())

# Apply normalization
for column in columns_to_normalize:
    data[f'{column}_n'] = normalize_column(data[column])

# Save the new dataset to a CSV file
data.to_csv('./data/normalized_full.csv', index=False)

print("Normalization complete. The normalized dataset is saved as 'normalized_dataset.csv'.")
