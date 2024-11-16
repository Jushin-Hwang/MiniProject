import socket

def read_server_info():
    ip = "127.0.0.1"
    port = 9999
    return ip, port

def start_client():
    ip, port = read_server_info()
    client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client.connect((ip, port))

    print("서버에 연결되었습니다. 'exit'을 입력하면 종료됩니다.")
    
    while True:
        command = input("명령어 입력: ")
        if command.lower() == "exit":
            break
        client.send(command.encode("utf-8"))
        response = client.recv(1024).decode("utf-8")
        print(response)

    client.close()

start_client()
