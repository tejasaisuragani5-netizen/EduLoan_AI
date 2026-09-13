import sys
import os

# Ensure current directory is in sys.path
_current_dir = os.path.dirname(os.path.abspath(__file__))
if _current_dir not in sys.path:
    sys.path.insert(0, _current_dir)

from app.main import app

if __name__ == '__main__':
    import uvicorn
    # Default to standard port 8080; in deployment, use cloud provider's PORT environment variable
    port = int(os.environ.get('PORT', 8080))
    uvicorn.run(app, host='0.0.0.0', port=port)
