// run server

cd E:\v5\server
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000




// run emulator

cd C:\Users\boybi\AppData\Local\Android\Sdk\emulator
.\emulator.exe -avd Medium_Phone_API_36.1




// run app

npm start
