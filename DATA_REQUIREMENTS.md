# Data Requirements

This document outlines the data requirements for the Trajectory Annotation Website trajectory analysis application.

## Required Data Structure

### Source Data Directory
Create a directory containing the following CSV files (example structure):

```
/path/to/your/data/
├── 2023-05-04-fps-10-scene-210-pedestrians.csv
├── 2023-05-04-fps-10-scene-210-others.csv
└── 2023-05-04-fps-10-scene-210-meta.csv
```

### File Naming Convention
Files must follow this pattern:
- `{date}-fps-{fps}-scene-{sceneId}-pedestrians.csv`
- `{date}-fps-{fps}-scene-{sceneId}-others.csv`
- `{date}-fps-{fps}-scene-{sceneId}-meta.csv`

Where:
- `date`: Format YYYY-MM-DD (e.g., 2023-05-04)
- `fps`: Frames per second (e.g., 10)
- `sceneId`: Scene identifier (e.g., 210)

### Required Columns

#### Pedestrians CSV (`pedestrians.csv`)
| Column | Type | Description |
|--------|------|-------------|
| `uniqueTrackId` | Integer | Unique identifier for each trajectory |
| `sceneX` | Float | X coordinate in scene space |
| `sceneY` | Float | Y coordinate in scene space |
| `sceneXVelocity` | Float | X component of velocity |
| `sceneYVelocity` | Float | Y component of velocity |
| `speed` | Float | Speed (can be derived if missing) |

#### Others CSV (`others.csv`)
Similar structure to pedestrians.csv but for non-pedestrian objects.

#### Meta CSV (`meta.csv`)
| Column | Type | Description |
|--------|------|-------------|
| `uniqueTrackId` | Integer | Unique identifier matching pedestrians.csv |
| `verticalDirection` | String | "NORTH" or "SOUTH" |

## Data Processing Parameters

Update these parameters in `Dataset/export_data.py`:

```python
# Configuration parameters
dataDir = "/path/to/your/trajectory/data"  # Update this path
sceneId = 210                              # Your scene ID
date = "2023-05-04"                       # Your data date
fps = 10                                  # Frames per second
minYDisplacement = 5                      # Minimum Y displacement for filtering
maxXDisplacement = 6                      # Maximum X displacement for filtering
```

## Installation of Required Python Library

Install the trajectory processing library:

```bash
pip install tti_dataset_tools
```

Or if using conda:
```bash
conda install -c conda-forge tti_dataset_tools
```

## Sample Data Generation

If you don't have real trajectory data, you can create sample data with the following structure:

```python
import pandas as pd
import numpy as np

# Generate sample pedestrian data
n_tracks = 50
n_points_per_track = 100

data = []
for track_id in range(1, n_tracks + 1):
    for frame in range(n_points_per_track):
        data.append({
            'uniqueTrackId': track_id,
            'sceneX': np.random.uniform(0, 100),
            'sceneY': np.random.uniform(0, 100),
            'sceneXVelocity': np.random.uniform(-2, 2),
            'sceneYVelocity': np.random.uniform(-2, 2),
            'speed': np.random.uniform(0, 3)
        })

df = pd.DataFrame(data)
df.to_csv('2023-05-04-fps-10-scene-210-pedestrians.csv', index=False)
```

## Output

After processing, the scripts will generate:
- `trajectory_data.json`: Processed trajectory data for the Java backend
- Contains fields: `sceneId`, `uniqueTrackId`, `localX`, `localY`

## Troubleshooting

### Common Issues:
1. **File not found**: Ensure your data directory path is correct
2. **Missing columns**: Verify CSV files have all required columns
3. **Import errors**: Install tti_dataset_tools library
4. **Permission errors**: Ensure read/write permissions for data directory
