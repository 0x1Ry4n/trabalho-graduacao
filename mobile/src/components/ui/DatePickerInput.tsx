import { Platform } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FormControl, Input, Button, Box, HStack, Icon, Pressable } from 'native-base';
import { Ionicons } from '@expo/vector-icons';

type DatePickerInputProps = {
    label: string;
    value: string; // formato interno: YYYY-MM-DD
    onChange: (value: string) => void;
    required?: boolean;
    minDate?: Date;
    maxDate?: Date;
    flex?: number;
    errorMessage?: string;
};

/** YYYY-MM-DD → DD/MM/YYYY */
const isoToDisplay = (iso: string): string => {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

/** DD/MM/YYYY → YYYY-MM-DD (retorna null se incompleta/inválida) */
const displayToIso = (display: string): string | null => {
    const digits = display.replace(/\D/g, '');
    if (digits.length < 8) return null;
    const d = digits.slice(0, 2);
    const m = digits.slice(2, 4);
    const y = digits.slice(4, 8);
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (
        Number.isNaN(date.getTime()) ||
        date.getFullYear() !== Number(y) ||
        date.getMonth() + 1 !== Number(m) ||
        date.getDate() !== Number(d)
    ) return null;
    return `${y}-${m}-${d}`;
};

/** Aplica máscara DD/MM/YYYY conforme o usuário digita */
const maskDate = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let result = digits;
    if (digits.length > 2) result = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    if (digits.length > 4) result = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    return result;
};

const dateFromIso = (iso: string): Date => {
    if (!iso) return new Date();
    const parts = iso.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return new Date();
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return Number.isNaN(date.getTime()) ? new Date() : date;
};

const isoFromDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export default function DatePickerInput({
    label,
    value,
    onChange,
    required = false,
    minDate,
    maxDate,
    flex,
    errorMessage,
}: DatePickerInputProps) {
    const [showPicker, setShowPicker] = useState(false);
    const [tempDate, setTempDate] = useState<Date | null>(null);
    const [inputText, setInputText] = useState(() => isoToDisplay(value));

    const pickerDate = useMemo(() => dateFromIso(value), [value]);

    useEffect(() => {
        setInputText(isoToDisplay(value));
    }, [value]);

    const handleTextChange = (raw: string) => {
        const masked = maskDate(raw);
        setInputText(masked);
        const iso = displayToIso(masked);
        if (iso) onChange(iso);
    };

    const handlePickerChange = (_event: any, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
            if (date) {
                const iso = isoFromDate(date);
                onChange(iso);
                setInputText(isoToDisplay(iso));
            }
        } else {
            if (date) setTempDate(date);
        }
    };

    const handleIOSConfirm = () => {
        const iso = isoFromDate(tempDate ?? pickerDate);
        onChange(iso);
        setInputText(isoToDisplay(iso));
        setShowPicker(false);
        setTempDate(null);
    };

    const handleIOSCancel = () => {
        setShowPicker(false);
        setTempDate(null);
    };

    return (
        <FormControl isRequired={required} flex={flex} isInvalid={!!errorMessage}>
            <FormControl.Label>{label}</FormControl.Label>
            <HStack space={1} alignItems="center">
                <Input
                    flex={1}
                    value={inputText}
                    onChangeText={handleTextChange}
                    placeholder="DD/MM/AAAA"
                    keyboardType="numeric"
                    maxLength={10}
                />
                <Pressable
                    onPress={() => { setTempDate(null); setShowPicker(true); }}
                    p="2"
                    borderRadius="md"
                    _pressed={{ bg: 'coolGray.100' }}
                    _dark={{ _pressed: { bg: 'coolGray.700' } }}
                >
                    <Icon as={Ionicons} name="calendar-outline" size="5" color="coolGray.500" />
                </Pressable>
            </HStack>

            {showPicker && (
                <Box>
                    <DateTimePicker
                        value={tempDate ?? pickerDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handlePickerChange}
                        minimumDate={minDate}
                        maximumDate={maxDate}
                    />
                    {Platform.OS === 'ios' && (
                        <HStack justifyContent="flex-end" space={2} px={2} pb={1}>
                            <Button size="sm" variant="ghost" colorScheme="coolGray" onPress={handleIOSCancel}>
                                Cancelar
                            </Button>
                            <Button size="sm" onPress={handleIOSConfirm}>
                                Confirmar
                            </Button>
                        </HStack>
                    )}
                </Box>
            )}
            <FormControl.ErrorMessage>{errorMessage}</FormControl.ErrorMessage>
        </FormControl>
    );
}
