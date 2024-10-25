import socket
import threading

# 서버 설정 및 계좌 정보 초기화
accounts = {"Kim": 20, "Lee": 50, "Park": 75, "Choi": 100, "Jung": 200}
accounts_lock = threading.Lock()

# 클라이언트 요청을 처리하는 함수
def handle_client(client_socket):
    # 클라이언트와의 통신 루프
    while True:
        request = client_socket.recv(1024).decode("utf-8")
        if not request:
            break
        response = process_request(request)
        client_socket.send(response.encode("utf-8"))
    client_socket.close()

# 요청 처리 함수
def process_request(request):
    command, *args = request.split()
    if command == "CHECK":
        return check_balance(args[0])
    elif command == "DEPOSIT":
        return deposit(args[0], int(args[1]))
    elif command == "WITHDRAW":
        return withdraw(args[0], int(args[1]))
    elif command == "TRANSFER":
        return transfer(args[0], args[1], int(args[2]))
    else:
        return "ERROR: Unknown command"
    
# 계좌 조회, 입금, 출금, 송금 함수
def check_balance(name) :

    value = accounts.get(name)

    if value == None:
        message = f"Do Not Found Account of {name} "
    else:
        message = f"{name}'s account balance: {accounts[name]} "

    return message

def deposit(name, amount) : 

    value = accounts.get(name)

    if value == None :
        message = f"Do Not Found Account of {name}"
    else :
        accounts[name] += amount
        message = f"Deposit Success. {name}'s account balance : {accounts[name]}"

    return message

def withdraw(name, amount) : 

    value = accounts.get(name)

    if value == None :
        message = f"Do Not Found Account of {name}"
    else :
        if amount > accounts[name] :
            message = f"Insufficient Account Balance. {name}'s Account Balance : {accounts[name]}"
        else :
            accounts[name] -= amount
            message = f"Withdraw Success. {name}'s Account Balance : {accounts[name]}"

    return message

def transfer(from_name, to_name, amount) :
    
    value_from = accounts.get(from_name)
    value_to = accounts.get(to_name)

    if value_from == None :
        message = f"Do Not Found Account of {from_name}"
    elif value_to == None :
        message = f"Do Not Found Account of {to_name}"
    else :
        if amount > accounts[from_name] :
            message = f"Insufficient Account Balance. {from_name}'s Account Balance : {accounts[from_name]}"
        else :
            accounts[from_name] -= amount
            accounts[to_name] += amount
            message = f"Transfer Success. {from_name}'s Account Balance : {accounts[from_name]}"

    return message

# 서버 시작
def start_server(ip, port):
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind((ip, port))
    server.listen(5)
    while True:
        client_socket, addr = server.accept()
        threading.Thread(target=handle_client, args=(client_socket,)).start()
        
start_server("127.0.0.1", 9999)
