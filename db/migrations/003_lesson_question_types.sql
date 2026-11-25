alter table lesson_questions drop constraint if exists lesson_questions_question_type_check;
alter table lesson_questions add constraint lesson_questions_question_type_check
  check(question_type in ('translation','definition','sentence_completion','reverse_translation','recall','context','synonym','antonym'));
