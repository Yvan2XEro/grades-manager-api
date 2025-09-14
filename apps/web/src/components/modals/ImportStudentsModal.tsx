import React, { useState } from 'react';
import { X, Upload, AlertCircle, Download } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const studentSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  registration_number: z.string().min(1, 'Registration number is required'),
  birth_date: z.string().optional(),
  birth_place: z.string().optional(),
  gender: z.enum(['M', 'F']).optional(),
});

type StudentImport = z.infer<typeof studentSchema>;

const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<StudentImport[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');

  const { data: classes } = useQuery({
    queryKey: ['activeClasses'],
    queryFn: async () => {
      const { data: yearData } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!yearData) return [];

      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          program:programs(name)
        `)
        .eq('academic_year_id', yearData.id)
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const downloadTemplate = () => {
    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Registration Number',
      'Birth Date',
      'Birth Place',
      'Gender',
    ];

    const csvContent = Papa.unparse({
      fields: headers,
      data: [
        [
          'John',
          'Doe',
          'john.doe@example.com',
          'REG001',
          '2000-01-01',
          'New York',
          'M',
        ],
      ],
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'student_import_template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const processFile = (file: File) => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }

    setIsProcessing(true);
    setErrors([]);
    setPreview([]);

    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => handleParseComplete(results.data),
        error: (error) => {
          toast.error(`Error parsing CSV: ${error.message}`);
          setIsProcessing(false);
        },
      });
    } else if (['xlsx', 'xls'].includes(fileExt || '')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
          handleParseComplete(jsonData);
        } catch (error) {
          toast.error('Error parsing Excel file');
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        toast.error('Error reading file');
        setIsProcessing(false);
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error('Unsupported file format. Please use CSV or Excel files.');
      setIsProcessing(false);
    }
  };

  const handleParseComplete = (data: any[]) => {
    const validationErrors: string[] = [];
    const validStudents: StudentImport[] = [];

    data.forEach((row, index) => {
      try {
        // Normalize field names
        const normalizedRow = {
          first_name: row['First Name'] || row['first_name'] || '',
          last_name: row['Last Name'] || row['last_name'] || '',
          email: row['Email'] || row['email'] || '',
          registration_number: row['Registration Number'] || row['registration_number'] || '',
          birth_date: row['Birth Date'] || row['birth_date'] || '',
          birth_place: row['Birth Place'] || row['birth_place'] || '',
          gender: row['Gender'] || row['gender'] || '',
        };

        const student = studentSchema.parse(normalizedRow);
        validStudents.push(student);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach((err) => {
            validationErrors.push(`Row ${index + 2}: ${err.message}`);
          });
        }
      }
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setPreview([]);
    } else if (validStudents.length === 0) {
      setErrors(['No valid data found in file']);
    } else {
      setPreview(validStudents);
      setErrors([]);
    }
    
    setIsProcessing(false);
  };

  const handleImport = async () => {
    if (!selectedClass) {
      toast.error('Please select a class');
      return;
    }

    if (preview.length === 0) {
      toast.error('No valid students to import');
      return;
    }

    setIsProcessing(true);
    try {
      const studentsToInsert = preview.map(student => ({
        ...student,
        class_id: selectedClass,
      }));

      const { error } = await supabase
        .from('students')
        .insert(studentsToInsert);

      if (error) throw error;

      toast.success(`Successfully imported ${preview.length} students`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(`Error importing students: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl">
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >
          <X className="h-4 w-4" />
        </button>
        
        <h3 className="font-bold text-lg mb-4">Import Students</h3>
        
        <div className="space-y-4">
          {/* Class Selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Select Class</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Select a class</option>
              {classes?.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.program?.name}
                </option>
              ))}
            </select>
          </div>

          {/* Template Download */}
          <div className="flex justify-end">
            <button
              onClick={downloadTemplate}
              className="btn btn-outline btn-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </button>
          </div>

          {/* File Upload */}
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-base-200">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">CSV or Excel files</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processFile(file);
                }}
                disabled={isProcessing || !selectedClass}
              />
            </label>
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="bg-error-50 text-error-700 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-5 w-5 mr-2" />
                <h4 className="font-medium">Validation Errors</h4>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Table */}
          {preview.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Preview ({preview.length} students)</h4>
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Registration #</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Birth Info</th>
                      <th>Gender</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((student, index) => (
                      <tr key={index}>
                        <td>{student.registration_number}</td>
                        <td>
                          {student.last_name}, {student.first_name}
                        </td>
                        <td>{student.email}</td>
                        <td>
                          {student.birth_date && (
                            <div>
                              <div>{student.birth_date}</div>
                              <div className="text-sm text-gray-500">
                                {student.birth_place}
                              </div>
                            </div>
                          )}
                        </td>
                        <td>{student.gender || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="modal-action">
            <button
              onClick={onClose}
              className="btn btn-ghost"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="btn btn-primary"
              disabled={isProcessing || preview.length === 0 || !selectedClass}
            >
              {isProcessing ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Processing...
                </>
              ) : (
                `Import ${preview.length} Students`
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default ImportStudentsModal;