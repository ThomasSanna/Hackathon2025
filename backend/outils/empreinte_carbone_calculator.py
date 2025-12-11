from codecarbon import EmissionsTracker

tracker = EmissionsTracker()

def start_calculation():
    tracker.start()
    
def stop_calculation():
    emissions = tracker.stop()
    return emissions

start_calculation()

def calcul_lourd():
    total = 0
    for i in range(10**7):
        total += i ** 2
    return total