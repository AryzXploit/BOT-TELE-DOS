#!/bin/bash

# Script untuk melihat dan monitoring log files
# Usage: ./view_logs.sh [options]

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get today's date
TODAY=$(date +%Y-%m-%d)

# Ensure logs directory exists
mkdir -p logs

echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}   📋 MHDDoS Log Viewer${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo ""

# Function to show menu
show_menu() {
    echo -e "${BLUE}Pilih log yang ingin dilihat:${NC}"
    echo ""
    echo "  1) 📄 General Log (Semua aktivitas)"
    echo "  2) ❌ Error Log (Hanya errors)"
    echo "  3) ⚠️  Warning Log (Hanya warnings)"
    echo "  4) 🤖 Bot Log (Aktivitas Telegram bot)"
    echo "  5) ⚔️  Attack Log (Aktivitas serangan)"
    echo "  6) 🔍 Search Log (Cari keyword)"
    echo "  7) 📊 Stats (Statistik log)"
    echo "  8) 🔄 Live Monitor (Real-time)"
    echo "  9) 📁 List All Logs"
    echo "  0) ❌ Exit"
    echo ""
    echo -ne "${GREEN}Pilihan [0-9]: ${NC}"
}

# Function to view log file
view_log() {
    local logfile=$1
    local logname=$2
    
    if [ -f "$logfile" ]; then
        echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}📖 Viewing: $logname${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
        
        # Show last 100 lines with colors
        tail -n 100 "$logfile" | while IFS= read -r line; do
            if [[ $line == *"[ERROR]"* ]]; then
                echo -e "${RED}${line}${NC}"
            elif [[ $line == *"[WARNING]"* ]]; then
                echo -e "${YELLOW}${line}${NC}"
            elif [[ $line == *"[SUCCESS]"* ]]; then
                echo -e "${GREEN}${line}${NC}"
            elif [[ $line == *"[BOT]"* ]]; then
                echo -e "${CYAN}${line}${NC}"
            elif [[ $line == *"[ATTACK]"* ]]; then
                echo -e "${BLUE}${line}${NC}"
            else
                echo "$line"
            fi
        done
        
        echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}💡 Showing last 100 lines. For full log: cat $logfile${NC}\n"
    else
        echo -e "\n${RED}❌ File not found: $logfile${NC}"
        echo -e "${YELLOW}💡 Log file belum dibuat. Jalankan bot terlebih dahulu.${NC}\n"
    fi
}

# Function to live monitor
live_monitor() {
    local logfile=$1
    local logname=$2
    
    if [ -f "$logfile" ]; then
        echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}🔄 Live Monitoring: $logname${NC}"
        echo -e "${GREEN}Press Ctrl+C to stop${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
        
        tail -f "$logfile" | while IFS= read -r line; do
            if [[ $line == *"[ERROR]"* ]]; then
                echo -e "${RED}${line}${NC}"
            elif [[ $line == *"[WARNING]"* ]]; then
                echo -e "${YELLOW}${line}${NC}"
            elif [[ $line == *"[SUCCESS]"* ]]; then
                echo -e "${GREEN}${line}${NC}"
            elif [[ $line == *"[BOT]"* ]]; then
                echo -e "${CYAN}${line}${NC}"
            elif [[ $line == *"[ATTACK]"* ]]; then
                echo -e "${BLUE}${line}${NC}"
            else
                echo "$line"
            fi
        done
    else
        echo -e "\n${RED}❌ File not found: $logfile${NC}\n"
    fi
}

# Function to search logs
search_logs() {
    echo -ne "\n${GREEN}🔍 Enter search keyword: ${NC}"
    read keyword
    
    if [ -z "$keyword" ]; then
        echo -e "${RED}❌ Keyword tidak boleh kosong${NC}\n"
        return
    fi
    
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🔍 Searching for: $keyword${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    
    grep -i "$keyword" logs/*.log 2>/dev/null | while IFS= read -r line; do
        if [[ $line == *"[ERROR]"* ]]; then
            echo -e "${RED}${line}${NC}"
        elif [[ $line == *"[WARNING]"* ]]; then
            echo -e "${YELLOW}${line}${NC}"
        elif [[ $line == *"[SUCCESS]"* ]]; then
            echo -e "${GREEN}${line}${NC}"
        elif [[ $line == *"[BOT]"* ]]; then
            echo -e "${CYAN}${line}${NC}"
        elif [[ $line == *"[ATTACK]"* ]]; then
            echo -e "${BLUE}${line}${NC}"
        else
            echo "$line"
        fi
    done || echo -e "${YELLOW}No results found${NC}"
    
    echo ""
}

# Function to show stats
show_stats() {
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📊 Log Statistics${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    
    # Count today's logs
    if [ -f "logs/general-$TODAY.log" ]; then
        local total=$(wc -l < "logs/general-$TODAY.log")
        local errors=$(grep -c "\[ERROR\]" "logs/general-$TODAY.log" 2>/dev/null || echo 0)
        local warnings=$(grep -c "\[WARNING\]" "logs/general-$TODAY.log" 2>/dev/null || echo 0)
        local bot=$(grep -c "\[BOT\]" "logs/general-$TODAY.log" 2>/dev/null || echo 0)
        local attacks=$(grep -c "\[ATTACK\]" "logs/general-$TODAY.log" 2>/dev/null || echo 0)
        
        echo -e "${BLUE}📅 Date: $TODAY${NC}"
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "  📝 Total Lines:     $total"
        echo -e "  ${RED}❌ Errors:          $errors${NC}"
        echo -e "  ${YELLOW}⚠️  Warnings:        $warnings${NC}"
        echo -e "  ${CYAN}🤖 Bot Activities:  $bot${NC}"
        echo -e "  ${BLUE}⚔️  Attack Logs:     $attacks${NC}"
        echo ""
    else
        echo -e "${YELLOW}No logs for today yet.${NC}\n"
    fi
    
    # List all log files
    echo -e "${BLUE}📁 Available Log Files:${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ -d "logs" ] && [ "$(ls -A logs/*.log 2>/dev/null)" ]; then
        ls -lh logs/*.log 2>/dev/null | tail -n +1 | awk '{print "  " $9 " - " $5}' | sed 's|logs/||'
    else
        echo -e "  ${YELLOW}No log files found${NC}"
    fi
    
    echo ""
}

# Function to list all logs
list_logs() {
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📁 All Log Files${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    
    if [ -d "logs" ] && [ "$(ls -A logs/ 2>/dev/null)" ]; then
        ls -lhtr logs/ | tail -n +2 | awk '{
            size=$5
            file=$9
            if (file ~ /error/) color="\033[0;31m"
            else if (file ~ /warning/) color="\033[1;33m"
            else if (file ~ /bot/) color="\033[0;36m"
            else if (file ~ /attack/) color="\033[0;34m"
            else color="\033[0m"
            printf "  %s%-40s\033[0m %8s\n", color, file, size
        }'
    else
        echo -e "  ${YELLOW}No log files found${NC}"
    fi
    
    echo ""
}

# Main loop
while true; do
    show_menu
    read choice
    
    case $choice in
        1)
            view_log "logs/general-$TODAY.log" "General Log"
            ;;
        2)
            view_log "logs/errors-$TODAY.log" "Error Log"
            ;;
        3)
            view_log "logs/warnings-$TODAY.log" "Warning Log"
            ;;
        4)
            view_log "logs/bot-$TODAY.log" "Bot Log"
            ;;
        5)
            view_log "logs/attacks-$TODAY.log" "Attack Log"
            ;;
        6)
            search_logs
            ;;
        7)
            show_stats
            ;;
        8)
            echo -e "\n${BLUE}Pilih log untuk monitoring:${NC}"
            echo "  1) General"
            echo "  2) Errors"
            echo "  3) Bot"
            echo "  4) Attacks"
            echo -ne "${GREEN}Pilihan [1-4]: ${NC}"
            read monitor_choice
            
            case $monitor_choice in
                1) live_monitor "logs/general-$TODAY.log" "General Log" ;;
                2) live_monitor "logs/errors-$TODAY.log" "Error Log" ;;
                3) live_monitor "logs/bot-$TODAY.log" "Bot Log" ;;
                4) live_monitor "logs/attacks-$TODAY.log" "Attack Log" ;;
                *) echo -e "${RED}Invalid choice${NC}" ;;
            esac
            ;;
        9)
            list_logs
            ;;
        0)
            echo -e "\n${CYAN}Goodbye! 👋${NC}\n"
            exit 0
            ;;
        *)
            echo -e "\n${RED}❌ Invalid choice. Please select 0-9${NC}\n"
            ;;
    esac
    
    echo -e "${YELLOW}Press Enter to continue...${NC}"
    read
    clear
done
