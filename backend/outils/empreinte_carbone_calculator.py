from codecarbon import EmissionsTracker

def initialize_tracker():
    tracker = EmissionsTracker(
        project_name="semantic_analysis",
        output_dir="outils/fichiers",
        log_level="error"
    )
    return tracker

def start_calculation(tracker):
    tracker.start()
    
def stop_calculation(tracker):
    emissions = tracker.stop()
    return emissions